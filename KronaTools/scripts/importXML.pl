#! /usr/bin/perl

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
