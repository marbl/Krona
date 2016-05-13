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

getContigMagnitudesCA.pl <assembly_folder> <output>

Writes a magnitude file for use with import scripts.  The magnitude of each
contig will be the total number of bases assigned to it (also equal to
depth * length).

';
	exit;
}

my ($wgsFolder, $output) = @ARGV;


my ($frgctgFile) = glob "$wgsFolder/9-terminator/*.posmap.frgctg";
my %contigMagnitudes;

open POSMAP, "<$frgctgFile" or die $!;

while ( my $line = <POSMAP> )
{
	my ($read, $contigID, $start, $end, $strand) = split /\t/, $line;
	
	my $contigName = 'ctg' . $contigID;
	
	$contigMagnitudes{$contigName} += $end - $start + 1;
}

close POSMAP;

open OUT, ">$output" or die $!;

foreach my $contig ( keys %contigMagnitudes )
{
	print OUT "$contig\t$contigMagnitudes{$contig}\n";
}

close OUT;
