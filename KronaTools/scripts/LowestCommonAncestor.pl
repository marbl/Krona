#! /usr/bin/perl

use strict;

use lib `ktGetLibPath`;
use KronaTools;

loadTaxonomy();

while ( <> )
{
	chomp;
	my @gis = split /\s+/;
	
	print "@gis\n";
	my @taxIDs = map {getTaxIDFromGI($_)} @gis;
	print "@taxIDs\n";
	my $lca = taxLowestCommonAncestor(@taxIDs);
	my $name = getTaxName($lca);
	my $rank = getTaxRank($lca);
	print "$lca\t$name\t$rank\n";
}