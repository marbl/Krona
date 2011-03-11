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

my $outFile = 'text.krona.html';
my $name = 'all';
my $local;

GetOptions(
	'o=s' => \$outFile,
	'n=s' => \$name,
	'l'   => \$local
	);

if
(
	@ARGV < 1
)
{
	print '

importText.pl [options] file1.txt [file2.txt] ...

Creates a Krona chart based on a text file that lists wedge hierarchies and
sizes.  Each line should be a list of wedges to contribute to (starting from the
highest level) followed by a number, separated by tabs.  If no wedges are listed
(and just a number is given), it will contribute to the top level.  If the same
wedge is listed more than once, the values will be added.

Options:

   [-o <string>]  Output file.  Default is text.krona.html

   [-n <string>]  Name of the highest level.  Default is "all".

   [-l]           Create a local chart, which does not require an internet
                  connection to view (but will only work on this computer).

';
	
	exit;
}

my %all;
my @levels;

foreach my $fileName ( @ARGV )
{
	open INFILE, "<$fileName" or die $!;
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my @calls = split /\t/, $line;
		my $magnitude = pop @calls;
		
		add(\%all, $magnitude, @calls);
	}
	
	close INFILE;
}

writeTree(\%all, $name, $outFile, $local);


sub add
{
	my $child;
	my ($node, $magnitude, @calls) = @_;
	
	if ( ! defined ${$node}{'children'} )
	{
		${$node}{'children'} = ();
	}
	
	#print "${$node}{'magnitude'}\t$magnitude\t@calls\n";
	
	${$node}{'magnitude'} += $magnitude;
	
	if ( @calls > 0 )
	{
		my $name = shift @calls;
		
		if ( $name eq '' )
		{
			$name = 'unknown';
		}
		
		if ( ! defined ${$node}{'children'}{$name} )
		{
			my %newHash = ();
			${$node}{'children'}{$name} = \%newHash;
		}
		
		$child = ${$node}{'children'}{$name};
		${$child}{'rank'} = $levels[(scalar @levels) - (scalar @calls)];
		
		add($child, $magnitude, @calls);
	}
}
