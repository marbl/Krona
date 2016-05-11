#!/usr/bin/env perl

use strict;

my @totals;

foreach my $file ( @ARGV )
{
	open IN, "<$file" or die $!;
	
	# eat headers
	#
	<IN>;
	<IN>;
	
	my $i = 0;
	
	while ( my $line = <IN> )
	{
		my @vals = split /,/, $line;
		
		for ( my $j = 0; $j < 3; $j++ )
		{
			$totals[$i][$j] += $vals[$j + 2];
		}
		
		$i++;
	}
	
	close IN;
}

print ",,,Human\n";
print ",,top hit,hit,no hit\n";
print ",top hit,", join(',', @{$totals[0]}), "\n";
print "NHP,hit,", join(',', @{$totals[1]}), "\n";
print ",no hit,", join(',', @{$totals[2]}), "\n";
