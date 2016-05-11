#!/usr/bin/env perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


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

use Krona;

my $totalMag;

my @options =
qw(
	out
	radius
	verbose
);

setOption('out', 'blast.taxonomy.tab');
setOption('radius', 0);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
 	print '

Description:
   Infers taxonomic abundance from BLAST results.

Usage:

ktClassifyBLAST [options] \
   blast_output_1[:magnitude_file_1] \
   blast_output_2[:magnitude_file_2] \
   ...

Input:

   blast_output      File containing BLAST results in tabular format ("Hit table
                     (text)" when downloading from NCBI).  If running BLAST
                     locally, subject IDs in the local database must contain GI
                     numbers in "gi|12345" format.
   
   [magnitude_file]  Optional file listing query IDs with magnitudes, separated
                     by tabs.  The can be used to account for read length or
                     contig depth to obtain a more accurate representation of
                     abundance.  By default, query sequences without specified
                     magnitudes will be assigned a magnitude of 1.  Magnitude
                     files for Newbler or Celera Assembler assemblies can be
                     created with getContigMagnitudesNewbler.pl or
                     getContigMagnitudesCA.pl

';
	printOptions(@options);
	exit;
}

my %bestScores;
my %lca;
my %lcaMag;

# load taxonomy

print "Loading taxonomy...\n";
loadTaxonomy();

# parse BLAST results

foreach my $input (@ARGV)
{
	my ($fileName, $magFile) = split /:/, $input;
	
	$fileName =~ /([^\/]+)\./;
	
	my %magnitudes;
	
	# load magnitudes
	
	if ( defined $magFile )
	{
		print "Loading magnitudes for $fileName...\n";
		
		open MAG, "<$magFile" or die $!;
		
		while ( my $line = <MAG> )
		{
			chomp $line;
			my ( $id, $mag ) = split /\t/, $line;
			$magnitudes{$id} = $mag;
		}
		
		close MAG;
	}
	
	print "Classifying $fileName...\n";
	
	open BLAST, "<$fileName";
	
	my $lastQueryID;
	my $topScore;
	my $taxID;
	my $score;
	
	while ( my $line = <BLAST> )
	{
		if ( $line =~ /^#/ )
		{
			next;
		}
		
		chomp $line;
		
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
			$bitScore
		) = split /\t/, $line;
		
		$hitID =~ /gi\|(\d+)/;
		my $gi = $1;
		
		my $bestScore = $bestScores{$queryID};
		#print "$queryID\t$bestScore\n";
		if
		(
			defined $gi &&
			(
				! defined $bestScore ||
				$bitScore >= $bestScore - getOption('radius')
			)
		)
		{
			if
			(
				! defined $bestScore ||
				$bitScore > $bestScore
			)
			{
				$bestScores{$queryID} = $bitScore
			}
			
			my $taxID = getTaxID($gi);
			
			if ( defined $lca{$queryID} )
			{
				$lca{$queryID} = lowestCommonAncestor($lca{$queryID}, $taxID);
			}
			else
			{
				$lca{$queryID} = $taxID;
			}
			
			if ( defined $magnitudes{$lastQueryID} )
			{
				$lcaMag{$queryID} = $magnitudes{$queryID};
			}
			else
			{
				$lcaMag{$queryID} = 1;
			}
			
		}
	}
}

my %totalMagnitudes;
my %totalScores;
my %totalCounts;

print "Computing taxon totals...\n";

foreach my $query ( keys %lca )
{
	# add the chosen hit from the last queryID
	
	my $taxID = $lca{$query};
	
	if ( getOption('verbose') )
	{
		print "$query:\ttaxID=$taxID\tmag=$lcaMag{$query}\tscore=$bestScores{$query}\n";
	}
	
	#add($set, \%tree, $taxID, $magnitude, $score);
	
	$totalMagnitudes{$taxID} += $lcaMag{$query};
	$totalScores{$taxID} += $bestScores{$query};
	$totalCounts{$taxID}++;
}

my $outFile = getOption('out');

print "Writing $outFile...\n";

open OUT, ">$outFile" or die "Could not open $outFile for writing";

foreach my $taxID ( keys %totalMagnitudes )
{
	my $score = $totalScores{$taxID} / $totalCounts{$taxID};
	
	print OUT "$taxID\t$totalMagnitudes{$taxID}\t$score\n";
}

close OUT;
