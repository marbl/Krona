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

setOption('name', 'all');
setOption('key', 0);

my @options =
qw(
	out
	name
	minConfidence
	combine
	depth
	hueBad
	hueGood
	phymm
	url
	postUrl
);

getKronaOptions(@options);

if ( @ARGV < 1 )
{
	setOption('out', 'phymm(bl).krona.html');
	
	printUsage
	(
		'Creates a Krona chart of Phymm or PhymmBL results.

Note: Since confidence scores are not given for species/subspecies
classifications, they inheret confidence scores from genus classifications.',
		'phymmbl_results',
		'PhymmBL results files (results.03.*). Results can also be from Phymm
alone (results.01.*), but ' . getOptionString('phymm') . ' must be specified.',
		1,
		1,
		\@options
	);
	
	exit 0;
}

if ( ! defined getOption('out') )
{
	if ( getOption('phymm') )
	{
		setOption('out', 'phymm.krona.html');
	}
	else
	{
		setOption('out', 'phymmbl.krona.html');
	}
}

my @ranks =
(
	'Phylum',
	'Class',
	'Order',
	'Family',
	'Genus',
	'Species/Subspecies'
);

my $tree = newTree();
my $set = 0;
my @datasetNames;
my $useMag;

foreach my $input ( @ARGV )
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	my %magnitudes;
	
	print "Importing $fileName...\n";
	
	if ( defined $magFile )
	{
		print "   Loading magnitudes from $magFile...\n";
		loadMagnitudes($magFile, \%magnitudes);
		$useMag = 1;
	}
	
	print "   Reading classifications from $fileName...\n";
	
	open INFILE, "<$fileName" or die $!;
	
	<INFILE>; # eat header
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my @values = split /\t/, $line;
		my @lineage;
		my $scores;
		
		my $readID = shift @values;
		
		if ( getOption('phymm') )
		{
			my ($species, $score);
			
			($species, $score, @lineage) = @values;
			
			$scores = $score;
			
			@lineage = reverse @lineage;
			
			push @lineage, $species;
		}
		else
		{
			if ( @values < 12 )
			{
				my $phymm = getOptionString('phymm');
				ktDie("Not enough fields in $fileName.  Is it a PhymmBL result file (see $phymm)?");
			}
			
			$scores = ();
			
			$values[1] = $values[3]; # use genus conf for species
			
			for ( my $i = 0; $i < @values; $i += 2 )
			{
				unshift @lineage, $values[$i];
				unshift @$scores, $values[$i + 1];
			}
		}
		
		for ( my $i = 0; $i < @lineage; $i++ )
		{
			$lineage[$i] = decode($lineage[$i]);
		}
		
		map { if ( $_ eq '' ) { $_ = 'unknown' } } @lineage;
		
		addByLineage($tree, $set, \@lineage, $readID, $magnitudes{$readID}, $scores, \@ranks);
	}
	
	close INFILE;
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
}

# tree output

my @attributeNames =
(
	'magnitude',
	'count',
	'unassigned',
	'rank',
	'score'
);

my @attributeDisplayNames =
(
	$useMag ? 'Magnitude' : undef,
	'Count',
	'Unassigned',
	'Rank',
	getOption('phymm') ? 'Avg. score' : 'Avg. confidence'
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	getOption('hueBad'),
	getOption('hueGood')
);


# subroutines

sub decode
{
	# return special characters in place of their Phymm placeholders
	
	my ($string) = @_;
	
	$string =~ s/_/ /g;
	$string =~ s/UNDERSCORE/_/g;
	$string =~ s/SLASH/\//g;
	$string =~ s/LPAREN/\(/g;
	$string =~ s/RPAREN/\)/g;
	$string =~ s/SINGLEQUOTE/'/g;
	$string =~ s/DOUBLEQUOTE/"/g;
	$string =~ s/COLONCOLON/:/g;
	$string =~ s/SEMICOLON/;/g;
	
	return $string;
}

