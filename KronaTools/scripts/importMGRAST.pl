# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


#! /usr/bin/perl

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

my $outFile = 'MG-RAST.krona.html';
my $name = 'all';
my $local;

GetOptions(
	'o=s' => \$outFile,
	'n=s' => \$name,
	'l'   => \$local
	);

if
(
	!defined $outFile ||
	@ARGV < 1
)
{
	print '

importMG-RAST.pl [options] table1.tsv [table2.tsv] ...

Creates a Krona chart from tables exported from MG-RAST sequence profiles.
The profiles can be metabolic or phylogenetic, but must be consistent.

Options:

   [-o <string>]  Output file.  Default is MG-RAST.krona.html

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
	
	<INFILE>; # eat header
	
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
