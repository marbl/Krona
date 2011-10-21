#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

use strict;

use Cwd 'abs_path';
use Getopt::Long;

my $path = '/usr/local';
my $taxonomyDir;

GetOptions(
	'prefix=s'   => \$path,
	'taxonomy=s' => \$taxonomyDir
	);

$path = abs_path($path);

if ( defined $taxonomyDir )
{
	$taxonomyDir = abs_path($taxonomyDir);
}

my $scriptPath = abs_path('scripts');
my $libPath = abs_path('lib');

createDir($path);
createDir("$path/bin");
createDir("$path/lib");

print "Creating links...\n";

foreach my $script qw
(
	ClassifyBLAST
	GetContigMagnitudes
	ImportBLAST
	ImportGalaxy
	ImportMETAREP
	ImportMGRAST
	ImportPhymmBL
	ImportRDP
	ImportRDPComparison
	ImportTaxonomy
	ImportText
	ImportXML
)
{
	if ( system('ln', '-sf', "$scriptPath/$script.pl", "$path/bin/kt$script") )
	{
		linkFail("$path/bin");
	}
}

if ( system('ln', '-sf', "$libPath/Krona.pm", "$path/lib") )
{
	linkFail("$path/lib");
}

print "Creating taxonomy directory...\n";

if ( defined $taxonomyDir )
{
	if ( ! -e $taxonomyDir )
	{
		mkdir $taxonomyDir or
			die "$taxonomyDir does not exist and couldn't create";
	}
	
	if ( -e 'taxonomy')
	{
		system('rm -r taxonomy');
	}
	
	system('ln -s -f -F ' . $taxonomyDir . ' taxonomy');
}
else
{
	mkdir 'taxonomy';
}

print '
Installation complete.

To import from BLAST or METAREP, run updateTaxonomy.sh to build the local
taxonomy database.
';

sub createDir
{
	my ($dir) = @_;
	
	if ( ! -e $dir )
	{
		mkdir $dir or die "$dir does not exist and couldn't create";
	}
}

sub linkFail
{
	my ($path) = @_;
	
	print "\nCouldn't link files to $path.  Do you have permission?\n";
	print "(Use \"--prefix <path>\" to change install location)\n\n";
	exit 1;
}
