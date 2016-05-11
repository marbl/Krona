#!/usr/bin/env perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

BEGIN
{
	use File::Basename;
	use Cwd 'abs_path';
	use lib dirname(abs_path($0)) . "/../lib";
	use KronaTools;
}

use Getopt::Long;

my $help;
my $totalMag;
my $prepend;
my $append;
my $tax;

GetOptions
(
	'h' => \$help,
	'help' => \$help,
	'p' => \$prepend,
	'a' => \$append,
	'tax=s' => \$tax
);

if ( defined $tax )
{
	setOption('taxonomy', $tax);
}

if ( $help )
{
	print '
Description:
   Translates accessions from <stdin> to NCBI taxonomy IDs. The accession can
   be bare  or in the fourth field of pipe notation (e.g.
   "gi|12345|xx|ABC123.1|", Accessions with no taxonomy IDs in the database will
   return 0.

Usage:

   ktGetTaxIDFromAcc [options] < acc_list > tax_ID_list

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
	
	my $acc;
	
	if ( /\|/ )
	{
		$acc = (split /\|/)[3];
	}
	else
	{
		$acc = $_
	}
	
	if ( $append )
	{
		print "$_\t";
	}
	
	print int(getTaxIDFromAcc($acc));
	
	if ( $prepend )
	{
		print "\t$_";
	}
	
	print "\n";
}
