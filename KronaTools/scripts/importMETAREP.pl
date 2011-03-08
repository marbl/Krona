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

my $outFile = 'metarep.krona.html';
my $name = 'root';
my $random;
my $useHue;
my $local;
my $verbose;

GetOptions(
	'o=s' => \$outFile,
	'n=s' => \$name,
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
   Infers taxonomic abundance from the best BLAST hits listed in the blast.tab
   file in a METAREP data set.

Usage:

importMETAREP.pl <blast.tab>

Options:

   [-o <string>]  Output file name.  Default is metarep.krona.html.

   [-n <string>]  Name of the highest level.  Default is "all".

   [-r]           Break ties for the top hit randomly.  Default is to use the
                  lowest common ancestor of all ties for the top hit.

   [-h]           Set the hue of each taxon based on the average confidence of
                  its predictions.  The range in hue from red to green
                  represents PhymmBL confidence scores from 0 to 1.  Since
                  species level predictions are not given confidence scores,
                  they will inheret their genus level confidence.

   [-l]           Create a local chart, which does not require an internet
                  connection to view (but will only work on this computer).

   [-v]           Verbose.

';
	exit;
}

my ($input) = @ARGV;

my $tree = newTree();

# taxonomy must be loaded for LCA

print "Loading taxonomy...\n";
loadTaxonomy();

print "Creating tree...\n";

open IN, "<$ARGV[0]" or die $!;

my $lastReadID;

while ( my $line = <IN> )
{
	chomp $line;
	my @values = split /\t/, $line;
	
	my $readID = $values[0];
	
	if ( $readID ne $lastReadID )
	{
		my $ties = 0;
		my $taxID;
		my $readLength = $values[2];
		
		while ( $values[15] =~ /taxon:(\d+)/g )
		{
			my $newTaxID = $1;
			
			if ( ! taxIDExists($newTaxID) )
			{
				print STDERR "$readID: Taxon $newTaxID does not exist; using root.\n";
				$newTaxID = 1;
			}
			
			if ( $random && int(rand(++$ties)) == 0 )
			{
				$taxID = $newTaxID;
			}
			elsif ( ! $random )
			{
				if ( $taxID )
				{
					$taxID = lowestCommonAncestor($taxID, $newTaxID);
				}
				else
				{
					$taxID = $newTaxID;
				}
			}
		}
		
		if ( $verbose )
		{
			print "$readID\ttaxID: $taxID\n";
		}
		
		add($tree, $taxID, $readLength, $values[11]);
	}
	
	$lastReadID = $readID;
}

close IN;

my @attributeNames =
(
	'taxon',
	'rank',
	'score',
);

my @attributeDisplayNames =
(
	'Taxon',
	'Rank',
	'Avg. % Similarity'
);

my $hueName;

if ( $useHue )
{
	$hueName = 'score';
}

writeTree
(
	$tree,
	$name,
	$outFile,
	$local,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	$hueName,
	0,
	.3333,
	30,
	100
);

