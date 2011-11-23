#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

use lib (`ktGetLibPath`);
use KronaTools;

my $totalMag;

while ( <> )
{
	chomp;
	
	if
	(
		$_ eq ''
	)
	{
		print '

Description:
   Translates GI numbers from <stdin> to NCBI taxonomy IDs.  A GI number can be
   identified within each line by "gi|<number>", or they can be bare numbers if
   nothing else is on the line.  Lines that do not fit either format will be
   ignored.  GIs with no taxonomy IDs in the database will return 0.

Usage:

	ktGetTaxIDFromGI < GI_list > tax_ID_list

';
		exit;
	}
	
	if ( /^(\d+)$/ || /gi\|(\d+)/ )
	{
		print int(getTaxID($1)), "\n";
	}
}
