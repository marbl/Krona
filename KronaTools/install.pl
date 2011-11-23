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

createDir($path);
createDir("$path/bin");

print "Creating links...\n";

foreach my $script qw
(
	ClassifyBLAST
	GetContigMagnitudes
	GetLibPath
	GetTaxIDFromGI
	ImportBLAST
	ImportDiskUsage
	ImportFCP
	ImportGalaxy
	ImportMETAREP-blast
	ImportMETAREP-EC
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

if ( defined $taxonomyDir )
{
	if ( ! -e $taxonomyDir )
	{
		print "Creating taxonomy directory...\n";
		
		mkdir $taxonomyDir or
			die "$taxonomyDir does not exist and couldn't create";
	}
	
	if ( -e 'taxonomy')
	{
		system('rm -r taxonomy');
	}
	
	print "Linking taxonomy to $taxonomyDir...\n";
	system('ln -s -f -F ' . $taxonomyDir . ' taxonomy');
}
elsif ( ! -d 'taxonomy' )
{
	print "Creating taxonomy directory...\n";
	mkdir 'taxonomy' or die "Couldn't create taxonomy directory";
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
