#!/usr/bin/env perl

use strict;

my ($fileClass, $fileEnzyme) = @ARGV;

open CLASS, $fileClass or die $fileClass;

while ( <CLASS> )
{
	chomp;
	
	if ( /^(\d+)\.\s*(\d+|-)\.\s*(\d+|-)\.\s*(\d+|-)\s+(.+)\.$/ )
	{
		my @classes = ($1, $2, $3, $4);
		my $desc = $5;
		
		while ( $classes[-1] eq '-' )
		{
			pop @classes;
		}
		
		print join '.', @classes;
		print "\t$desc\n";
	}
}

close CLASS;

my $id;
my $desc;

open ENZYME, $fileEnzyme or die $fileEnzyme;

while ( <ENZYME> )
{
	chomp;
	
	if ( /^ID\s+(\d+\.\d+\.\d+\.\d+)$/ )
	{
		$id = $1;
	}
	elsif ( /^DE\s+(.+)\.$/ )
	{
		$desc = $1;
	}
	elsif ( /^\/\/$/ )
	{
		if ( defined $id && defined $desc )
		{
			print "$id\t$desc\n";
		}
		
		undef $id;
		undef $desc;
	}
}

close ENZYME;
