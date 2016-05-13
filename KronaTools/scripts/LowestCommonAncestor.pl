#!/usr/bin/env perl

use strict;

BEGIN
{
	use File::Basename;
	use Cwd 'abs_path';
	use lib dirname(abs_path($0)) . "/../lib";
	use KronaTools;
}

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