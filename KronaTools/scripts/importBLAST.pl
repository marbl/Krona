#! /usr/bin/perl

# Copyright 2011 Brian Ondov
# 
# This file is part of Radiant.
# 
# Radiant is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# Radiant is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with Radiant.  If not, see <http://www.gnu.org/licenses/>.

use strict;

# get the path of this script; dependencies are relative
#
my $scriptPath;
BEGIN
{
	use Cwd 'abs_path';
	abs_path($0) =~ /(.*)\//;
	$scriptPath = $1;
}
use lib "$scriptPath/../lib";

use Getopt::Long;
use Krona;

my $magFile;
my $totalMag;
my $outFile = 'blast.krona.html';
my $include;
my $random;
my $useHue = 1;
my $local;
my $verbose;

GetOptions(
	'm=s' => \$magFile,
	'o=s' => \$outFile,
	'i'   => \$include,
	'r'   => \$random,
	'h'   => \$useHue,
	'l'   => \$local,
	'v'   => \$verbose
	);

if
(
	@ARGV < 1
)
{
 	print '

Description:
   Infers taxonomic abundance from BLAST results.  Results must be in tabular
   format ("Hit table (text)" when downloading from NCBI).  If running BLAST
   locally, subject IDs in the local database must contain GI numbers.

Usage:

importBLAST.pl [options] blast_output_1 [blast_output_2] ...

Options:

   [-o <string>]  Output file name.  Default is blast.krona.html.

   [-m <string>]  Magnitude file for query sequences.  Should list query IDs
                  with magnitudes, separated by tabs.  The can be used to
                  account for read length or contig depth to obtain a more
                  accurate representation of abundance.  By default, query
                  sequences without specified magnitudes will be assigned a
                  magnitude of 1.  Magnitude files for Newbler or Celera
                  Assembler assemblies can be created with
                  getContigMagnitudesNewbler.pl or getContigMagnitudesCA.pl

   [-i]           Include queries with no hits in the total magnitude of the
                  chart.  If running BLAST locally, the output must have comment
                  lines ("-m 9") to use this option.

   [-r]           Break ties for the top hit randomly.  Default is to use the
                  lowest common ancestor of all ties for the top hit.

   [-l]           Create a local chart, which does not require an internet
                  connection to view (but will only work on this computer).

   [-v]           Verbose.

';
	exit;
}

my %tree;
my %magnitudes;
my $totalMagnitude;

# load taxonomy

print "Loading taxonomy...\n";
loadTaxonomy();

# load magnitudes

if ( defined $magFile )
{
	print "Loading magnitudes...\n";
	
	open MAG, "<$magFile" or die $!;
	
	while ( my $line = <MAG> )
	{
		chomp $line;
		my ( $id, $mag ) = split /\t/, $line;
		$magnitudes{$id} = $mag;
	}
	
	close MAG;
}

# parse BLAST results

print "Creating tree...\n";

my $minIdentity;
my $maxIdentity;

foreach my $fileName (@ARGV)
{
	open BLAST, "<$fileName";
	
	my $lastQueryID;
	my $topScore;
	my $ties;
	my $taxID;
	my $hitIdentity;
	
	while ( 1 )
	{
		my $line = <BLAST>;
		
		if ( $line =~ /^#/ )
		{
			if ( $line =~ /Query: ([\S]+)/ )
			{
				# Add the magnitude of the query to the total in case it doesn't
				# have any hits.
				
				my $queryID = $1;
				
				if ( defined $magnitudes{$queryID} )
				{
					$totalMagnitude += $magnitudes{$queryID};
				}
				else
				{
					$totalMagnitude++;
				}
			}
			
			next;
		}
		
		my
		(
			$queryID,
			$hitID,
			$identity,
			$length,
			$mismatches,
			$gaps,
			$queryStart,
			$queryEnd,
			$subjectStart,
			$subjectEnd,
			$eVal,
			$score
		) = split /\t/, $line;
		
		if ( $queryID ne $lastQueryID && defined $taxID )
		{
			# add the chosen hit from the last queryID
			
			my $magnitude;
			
			if ( defined $magnitudes{$lastQueryID} )
			{
				$magnitude = $magnitudes{$lastQueryID};
			}
			else
			{
				$magnitude = 1;
			}
			
			if ( $verbose )
			{
				print "$lastQueryID:\ttaxID=$taxID\n";
			}
			
			if ( ! defined $minIdentity || $hitIdentity < $minIdentity )
			{
				$minIdentity = $hitIdentity;
			}
			
			if ( ! defined $maxIdentity || $hitIdentity > $maxIdentity )
			{
				$maxIdentity = $hitIdentity;
			}
			
			add(\%tree, $taxID, $magnitude, $hitIdentity);
			
			$ties = 1;
		}
		
		if ( ! defined $hitID )
		{
			last; # EOF
		}
		
		$hitID =~ /gi\|(\d+)/;
		
		my $gi = $1;
		
		if
		(
			$queryID ne $lastQueryID ||
			(
				$random &&
				$score == $topScore &&
				int(rand(++$ties)) == 0
			)
		)
		{
			$taxID = getTaxID($gi);
			$hitIdentity = $identity;
		}
		elsif ( ! $random && $score == $topScore )
		{
			$taxID = lowestCommonAncestor($taxID, getTaxID($gi));
#			$hitIdentity += $identity;
		}
		
		if ( $queryID ne $lastQueryID )
		{
			$topScore = $score;
		}
		
		$lastQueryID = $queryID;
	}
}

if ( $include && $totalMagnitude )
{
	$tree{'magnitude'} = $totalMagnitude;
}

my @attributeNames =
(
	'taxon',
	'rank',
	'score',
	'magnitude'
);

my @attributeDisplayNames =
(
	'Taxon',
	'Rank',
	'Avg. % Identity',
	defined $magFile ? 'Magnitude' : 'Hits'
);

my $hueName;

if ( $useHue )
{
	$hueName = 'score';
}

writeTree
(
	\%tree,
	'root',
	$outFile,
	$local,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	$hueName,
	0,
	.3333,
	$minIdentity,
	$maxIdentity
);
