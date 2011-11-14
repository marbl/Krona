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

use Krona;

setOption('out', 'xml.krona.html');

my @options =
qw(
	out
	local
	url
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	print '

ktImportXML [options] <XML_file>

';
	printOptions(@options);
	exit;
}

my ($xmlFile) = @ARGV;

my $outFile = getOption('out');

print "Writing $outFile...\n";

open OUT, ">$outFile";
print OUT header();

open IN, "<$xmlFile" or die $!;

while ( <IN> )
{
	print OUT $_;
}

close IN;

print OUT $Krona::footer;
close OUT;
