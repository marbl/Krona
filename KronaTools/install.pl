#!/usr/bin/env perl

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
my $help;

GetOptions(
	'prefix=s'   => \$path,
	'taxonomy=s' => \$taxonomyDir,
	'help' => \$help
	);

if ( $help )
{
	print "./install.pl [-prefix /path/to/install] [-taxonomy /path/to/taxonomy]\n";
	exit;
}

$path = abs_path($path);

if ( defined $taxonomyDir )
{
	$taxonomyDir = abs_path($taxonomyDir);
}

my $scriptPath = abs_path('scripts');

createDir($path);
createDir("$path/bin");

print "Creating links...\n";

foreach my $script
(qw(
	ClassifyHits
	ClassifyBLAST
	GetContigMagnitudes
	GetLCA
	GetLibPath
	GetTaxIDFromAcc
	GetTaxInfo
	ImportBLAST
	ImportDiskUsage
	ImportEC
	ImportFCP
	ImportGalaxy
	ImportHits
	ImportKrona
	ImportMETAREP-BLAST
	ImportMETAREP-EC
	ImportMGRAST
	ImportPhymmBL
	ImportRDP
	ImportRDPComparison
	ImportTaxonomy
	ImportText
	ImportXML
))
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
		ktDie("$taxonomyDir does not exist.");
	}
	
	if ( -e 'taxonomy')
	{
		system('rm -r taxonomy');
	}
	
	print "Linking taxonomy to $taxonomyDir...\n";
	system('ln -s -f -F ' . $taxonomyDir . ' taxonomy');
}

print '
Installation complete.

Run ./updateTaxonomy.sh to use scripts that rely on NCBI taxonomy:
   ktClassifyBLAST
   ktGetLCA
   ktGetTaxInfo
   ktImportBLAST
   ktImportTaxonomy
   ktImportMETAREP-BLAST

Run ./updateAccessions.sh to use scripts that get taxonomy IDs from accessions:
   ktClassifyBLAST
   ktGetTaxIDFromAcc
   ktImportBLAST
';

sub createDir
{
	my ($dir) = @_;
	
	if ( ! -e $dir )
	{
		mkdir $dir or ktDie("$dir does not exist and couldn't create");
	}
}

sub ktDie
{
	my ($error) = @_;
	
	print "\nERROR: $error\n\n";
	exit 1;
}

sub linkFail
{
	my ($path) = @_;
	
	ktDie("Couldn't link files to $path.  Do you have permission?\n(Use \"--prefix <path>\" to change install location)");
	exit 1;
}
