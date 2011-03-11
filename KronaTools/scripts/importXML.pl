#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

# get the path of this script; dependencies should be in the same directory
#
my $scriptPath;
BEGIN
{
	use Cwd 'abs_path';
	abs_path($0) =~ /(.*)\//;
	$scriptPath = $1;
}
use lib "$scriptPath/../lib";

use Getopt::Long;
use Krona;

my $outFile = 'xml.krona.html';
my $local;

GetOptions(
	'o=s' => \$outFile,
	'l'   => \$local
	);

if
(
	@ARGV < 1
)
{
	print '

importXML.pl [options] <XML_file>

Options:

   [-o <string>]  Output file.  Default is xml.krona.html

   [-l]           Create a local chart, which does not require an internet
                  connection to view (but will only work on this computer).

';
	
	exit;
}

my ($xmlFile) = @ARGV;

open OUT, ">$outFile";
print OUT header($local);

open IN, "<$xmlFile" or die $!;

while ( <IN> )
{
	print OUT $_;
}

close IN;

print OUT $Krona::footer;
close OUT;
