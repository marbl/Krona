#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

use lib (`ktGetLibPath`);
use KronaTools;
use Getopt::Long;

my $help;
my $totalMag;
my $prepend;
my $append;

GetOptions
(
	'h' => \$help,
	'help' => \$help,
	'p' => \$prepend,
	'a' => \$append
);

if ( $help )
{
	print '
Description:
   Translates GI numbers from <stdin> to NCBI taxonomy IDs.  A GI number can be
   identified within each line by "gi|<number>", or they can be bare numbers if
   nothing else is on the line.  Lines that do not fit either format will be
   ignored.  GIs with no taxonomy IDs in the database will return 0.

Usage:

   ktGetTaxIDFromGI [options] < GI_list > tax_ID_list

Options:

   -p  Prepend tax IDs to the original lines (separated by tabs).
  
   -a  Append tax IDs to the original lines (separated by tabs).

';
	exit;
}

if ( $prepend && $append )
{
	ktWarn('Both -p and -a specified. Only -a will be used.');
	$prepend = 0;
}

while ( <> )
{
	chomp;
	
	if ( /^(\d+)$/ || /gi\|(\d+)/ )
	{
		if ( $append )
		{
			print "$_\t";
		}
		
		print int(getTaxIDFromGI($1));
		
		if ( $prepend )
		{
			print "\t$_";
		}
		
		print "\n";
	}
}
