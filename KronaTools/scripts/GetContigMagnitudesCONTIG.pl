#!/usr/bin/env perl

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


if ( @ARGV < 2 )
{
	print '

ktGetContigMagnitudesCONTIG <assembly.contig> <output>

Writes a magnitude file for use with import scripts.  The magnitude of each
contig will be the total number of reads assigned to it.

';
	exit;
}

my ($contig, $output) = @ARGV;


open CONTIG, "<$newblerFolder/454ContigGraph.txt" or die $!;
open OUT, ">$output" or die $!;

while ( my $line = <CONTIG> )
{
	if ( $line =~ /^C/ )
	{
		last;
	}
	else
	{
		my @values = split /\t/, $line;
		
		my $magnitude = $values[2] * $values[3];
		print OUT "$values[1]\t$magnitude\n";
	}
}

close OUT;
close CONTIG;

