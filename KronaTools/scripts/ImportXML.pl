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

setOption('out', 'xml.krona.html');

my @options =
qw(
	out
	url
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	my $scriptName = getScriptName();
	
	printHeader("KronaTools $KronaTools::version - $scriptName");
	print
'Creates a Krona chart from xml data describing each node and how the chart
should look.
';
	printHeader('Usage');
	print
"$scriptName [options] <XML_file>

";
	printColumns
	(
		'   XML_file',
'A file containing XML tags that specify chart attributes and describe the node
hierarchy. An XML header is not necessary. For a complete description of XML
tags, see: https://sourceforge.net/p/krona/wiki/KronaTools/'
	);
	printOptions(@options);
	exit;
}

my ($xmlFile) = @ARGV;

my $outFile = getOption('out');

print "Writing $outFile...\n";

open OUT, ">$outFile";
print OUT htmlHeader();

open IN, "<$xmlFile" or die $!;

while ( <IN> )
{
	print OUT $_;
}

close IN;

print OUT htmlFooter();
close OUT;
