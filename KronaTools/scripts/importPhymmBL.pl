#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

# get the path of this script; dependencies should be in the same directory
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

my $outFile;
my $name = 'all';
my $minConfidence = 0;
my $colorConf;
my $magFile;
my $unclassified;
my $phymm;
my $local;

GetOptions(
	'o=s' => \$outFile,
	'n=s' => \$name,
	'm=s' => \$magFile,
	'i'   => \$unclassified,
	'c=f' => \$minConfidence,
	'h'   => \$colorConf,
	'p'   => \$phymm,
	'l'   => \$local
	);

if ( @ARGV < 1 )
{
	print '
importPhymmBL.pl [options] <results_1> [results_2] ...

Options:

   [-o <string>]  Output name.  Default is phymmbl.krona.html or
                  phymm.krona.html.

   [-n <string>]  Name of the highest level.  Default is "all".

   [-m <string>]  Magnitude file for query sequences.  Should list query IDs
                  with magnitudes, separated by tabs.  The can be used to
                  account for read length or contig depth to obtain a more
                  accurate representation of abundance.  By default, query
                  sequences without specified magnitudes will be assigned a
                  magnitude of 1.  Magnitude files for Newbler or Celera
                  Assembler assemblies can be created with
                  getContigMagnitudesNewbler.pl or getContigMagnitudesCA.pl

   [-i]           Include unclassified reads in the total magnitude (only if
                  magnitude file is specified)

   [-c <number>]  Minimum confidence (0-1).  Each query sequence will only be
                  added to taxa that were predicted with a confidence score of
                  at least this value.

   [-h]           Set the hue of each taxon based on the average confidence of
                  its predictions.  The range in hue from red to green
                  represents PhymmBL confidence scores from 0 to 1.  Since
                  species level predictions are not given confidence scores,
                  they will inheret their genus level confidence.

   [-p]           Input is phymm only (no confidence scores)

   [-l]           Create a local chart, which does not require an internet
                  connection to view (but will only work on this computer).

';
	
	exit;
}

if ( ! defined $outFile )
{
	if ( $phymm )
	{
		$outFile = 'phymm.krona.html';
	}
	else
	{
		$outFile = 'phymmbl.krona.html';
	}
}

my %all = ('children', ());

my %magnitudes;


if ( defined $magFile )
{
	open MAG, "<$magFile" or die $!;
	
	while ( my $line = <MAG> )
	{
		chomp $line;
		my ( $id, $magnitude ) = split /\t/, $line;
		$magnitudes{$id} = $magnitude;
		
		if ( $unclassified )
		{
			$all{'magnitude'} += $magnitude;
		}
	}
	
	close MAG;
}

foreach my $fileName ( @ARGV )
{
	open INFILE, "<$fileName" or die $!;
	
	<INFILE>; # eat header
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my $magnitude = 1;
		
		my
		(
			$readID,
			$bestMatch,
			$score,
			$genus,
			$genusConf,
			$family,
			$familyConf,
			$order,
			$orderConf,
			$class,
			$classConf,
			$phylum,
			$phylumConf
		);
		
		if ( $phymm )
		{
			(
				$readID,
				$bestMatch,
				$score,
				$genus,
				$family,
				$order,
				$class,
				$phylum
			) = split /\t/, $line;
			
			(
				$genusConf,
				$familyConf,
				$orderConf,
				$classConf,
				$phylumConf
			) = (1, 1, 1, 1, 1);
		}
		else
		{
			(
				$readID,
				$bestMatch,
				$score,
				$genus,
				$genusConf,
				$family,
				$familyConf,
				$order,
				$orderConf,
				$class,
				$classConf,
				$phylum,
				$phylumConf
			) = split /\t/, $line;
		}
		
		# return special characters in place of their Phymm placeholders
		#
		$bestMatch = decode($bestMatch);
		$genus = decode($genus);
		$family = decode($family);
		$order = decode($order);
		$class = decode($class);
		$phylum = decode($phylum);
		
		if ( defined %magnitudes )
		{
			$magnitude = $magnitudes{$readID};
			
			if ( ! defined $magnitude )
			{
				die "$readID doesn't exist in magnitude file";
			}
		}
		
		if
		(
			$phylumConf >= $minConfidence &&
			! ( defined $magFile && $unclassified )
		)
		{
			$all{'magnitude'} += $magnitude;
		}
		
		my $phylumHash = addPhymm(\%all, $phylum, $magnitude, $phylumConf, 'Phylum');
		my $classHash = addPhymm($phylumHash, $class, $magnitude, $classConf, 'Class');
		my $orderHash = addPhymm($classHash, $order, $magnitude, $orderConf, 'Order');
		my $familyHash = addPhymm($orderHash, $family, $magnitude, $familyConf, 'Family');
		my $genusHash = addPhymm($familyHash, $genus, $magnitude, $genusConf, 'Genus');
		addPhymm($genusHash, $bestMatch, $magnitude, $genusConf, 'Species/Subspecies');#$score); # TODO: translate score to conf
	}
	
	close INFILE;
}

# tree output

my %attributeNames =
(
	'rank' => 'Rank',
	'confidence' => 'Avg. conf.'
);

my $hueName;

if ( $colorConf )
{
	$hueName = 'confidence';
}

writeTree
(
	\%all,
	$name,
	$outFile,
	$local,
	'magnitude',
	\%attributeNames,
	$hueName,
	0,
	.3333,
	0,
	1
);

# subroutines

sub addPhymm
{
	my $result;
	my ($node, $child, $magnitude, $confidence, $rank) = @_;
	
	if ( $child eq '' )
	{
		$child = 'unknown taxon';
	}
	
	if ( defined $node && $confidence >= $minConfidence )
	{
		if ( ! defined ${$node}{'children'}{$child} )
		{
			${$node}{'children'}{$child} = ();
			${$node}{'children'}{$child}{'children'} = ();
#			${$node}{'children'}{$child}{'Rank'} = $rank;
		}
		
		$result = ${$node}{'children'}{$child};
		${$result}{'magnitude'} += $magnitude;
		
		if ( ! defined ${$result}{'rank'} )
		{
			${$result}{'rank'} = $rank;
		}
		
		${$result}{'totalScore'} += $confidence;
		${$result}{'scoreCount'}++;
		
		my $avgConf = sprintf("%.2f", ${$result}{'totalScore'} / ${$result}{'scoreCount'});
		
		if ( ! $phymm )
		{
			${$result}{'confidence'} = $avgConf;
		}
	}
	
	return $result;
}

sub decode
{
	my ($string) = @_;
	
	$string =~ s/_/ /g;
	$string =~ s/UNDERSCORE/_/g;
	$string =~ s/SLASH/\//g;
	$string =~ s/LPAREN/\(/g;
	$string =~ s/RPAREN/\)/g;
	$string =~ s/SINGLEQUOTE/'/g;
	$string =~ s/DOUBLEQUOTE/"/g;
	$string =~ s/COLONCOLON/:/g;
	$string =~ s/SEMICOLON/;/g;
	
	return $string;
}

