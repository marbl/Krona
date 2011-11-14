#! /usr/bin/perl

use strict;

my %descs;

print "# See <KronaTools>/data/README for provenance of this file.\n";

<>; # eat header

while ( <> )
{
	chomp;
	
	my ($ec, $desc) = split /\t/;
	
	# remove 'EC:' and extract numbers
	#
	my @lineage = split /\./, substr $ec, 3;
	
	# remove quotes from description
	#
	if ( $desc =~ /^"(.*)"$/ )
	{
		$desc = $1;
	}
	
	# remove '-' wildcard
	#
	if ( $lineage[-1] eq '-' )
	{
		pop @lineage;
	}
	
	my $newEC = join '.', @lineage;
	my $name = $desc;
	
	# store group descriptions and strip them from more specific groups to avoid
	# redundancy when they are displayed together.
	#
	if ( @lineage < 4 )
	{
		$descs{$newEC} = $desc;
		
		if ( @lineage > 1 )
		{
			my $parent = join '.', @lineage[0..@lineage - 2];
			my $parentDesc = $descs{$parent};
			
			$name =~ s/^$parentDesc\s+//;
		}
	}
	
	$name =~ s/\.$//; # remove trailing '.'
	
	print "$newEC\t$name\n";
}
