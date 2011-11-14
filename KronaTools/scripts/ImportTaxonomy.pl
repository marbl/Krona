#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

# get the path of this script; dependencies are relative
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

setOption('out', 'taxonomy.krona.html');
setOption('name', 'Root');

my @options =
qw(
	out
	include
	combine
	taxCol
	magCol
	scoreCol
	hueBad
	hueGood
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

Description:
   Creates a Krona chart based on a list of taxonomy IDs, their magnitudes, and,
   optionally, scores. By default, separate datasets for each input file will be
   created and named after the files (see -c). Taxa with a rank of "no rank"
   will be assigned to their parents (e.g. "Cellular organisms" will be assigned
   to "root").

Usage:

ktImportTaxonomy \
   [options] \
   <taxonomy_1>[,name_1] \
   [<taxonomy_2>[,name_2]] ...

Input:

<taxonomy>  Tab-delimited files with taxonomy IDs, magnitudes, and (optionally)
            scores. By default, these will be taken from columns 1, 2, and 3,
            respectively (see -t, -m, and -s).

';
	printOptions(@options);
	exit;
}

if ( getOption('magCol') == getOption('taxCol') )
{
	print "ERROR: Magnitude column must be different from taxonomy column.\n";
	exit 1;
}

if
(
	getOption('scoreCol') == getOption('taxCol') ||
	getOption('scoreCol') == getOption('magCol')
)
{
	print "WARNING: Score column already in use; not reading scores.\n";
	setOption('scoreCol', undef);
}

my $tree = newTree();

# taxonomy must be loaded for add()

print "Loading taxonomy...\n";

loadTaxonomy();

my $set = 0;
my @datasetNames;
my $useScore = 1; # is score column present?
my $eVal; # is score e-value (inferred by negative scores)?

foreach my $input (@ARGV)
{
	my ($file, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	print "Importing $file...\n";
	
	open IN, "<$file" or die "Couldn't open $file.";
	
	while ( my $line = <IN> )
	{
		chomp $line;
		
		my @fields = split /\t/, $line;
		
		my $taxID = $fields[getOption('taxCol') - 1];
		my $magnitude = $fields[getOption('magCol') - 1];
		my $score;
		
		if ( defined getOption('scoreCol') )
		{
			$score = $fields[getOption('scoreCol') - 1];
		}
		
		if ( $taxID == -2 )
		{
			$taxID = 1;
		}
		elsif ( $taxID == -1 )
		{
			if ( getOption('include') )
			{
				$taxID = 0;
			}
			else
			{
				next;
			}
		}
		
		if ( ! defined $score )
		{
			# all lines must have score to be used
			
			$useScore = 0;
		}
		
		if ( $score < 0 )
		{
			# score is probably e-value; flip colors
			
			$eVal = 1;
		}
		
		addByTaxID($tree, $set, $taxID, $magnitude, $score);
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
	
	close IN;
}

my @attributeNames =
(
	'magnitude',
	'taxon',
	'rank',
);

my @attributeDisplayNames =
(
	'Total',
	'Taxon',
	'Rank',
);

if ( $useScore )
{
	push @attributeNames, 'score';
	push @attributeDisplayNames, 'Avg. score';
}

my @scoreArgs;

if ( $useScore )
{
	@scoreArgs =
	(
		'score',
		$eVal ? getOption('hueGood') : getOption('hueBad'),
		$eVal ? getOption('hueBad') : getOption('hueGood')
	)
}

writeTree
(
	$tree,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	@scoreArgs
);

