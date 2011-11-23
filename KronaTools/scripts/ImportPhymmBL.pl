#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

use lib (`ktGetLibPath`);
use KronaTools;

setOption('name', 'all');

my @options =
qw(
	out
	name
	confidence
	combine
	depth
	hueBad
	hueGood
	phymm
	local
	url
);

getKronaOptions(@options);

if ( @ARGV < 1 )
{
	print '
ktImportPhymmBL [options] \
   <results_1>[:magnitude_file_1][,name_1] \
   [<results_2>[:magnitude_file_2][,name_2]]
   ...

Input:

   results           PhymmBL results files (results.03.*).  Results can also be
                     from Phymm alone (results.01.*), but -p must be specified.
                     By default, separate datasets will be created for each file
                     (see -c).

   [magnitude_file]  Optional file listing query IDs with magnitudes, separated
                     by tabs.  The can be used to account for read length or
                     contig depth to obtain a more accurate representation of
                     abundance.  By default, query sequences without specified
                     magnitudes will be assigned a magnitude of 1.  Magnitude
                     files for Newbler or Celera Assembler assemblies can be
                     created with getContigMagnitudesNewbler.pl or
                     getContigMagnitudesCA.pl

Note: Since confidence scores are not given for species/subspecies
classifications, they inheret confidence scores from genus classifications.

';
	setOption('out', 'phymm(bl).krona.html');
	printOptions(@options);
	exit;
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

my %all = ();
my $set = 0;
my @datasetNames;

foreach my $input ( @ARGV )
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	my %magnitudes;
	my $totalMagnitude;
	
	print "Importing $fileName...\n";
	
	if ( defined $magFile )
	{
		print "   Loading magnitudes from $magFile...\n";
		
		open MAG, "<$magFile" or die $!;
		
		while ( my $line = <MAG> )
		{
			chomp $line;
			my ( $id, $magnitude ) = split /\t/, $line;
			$magnitudes{$id} = $magnitude;
			$totalMagnitude += $magnitude;
		}
		
		close MAG;
	}
	
	print "   Reading classifications from $fileName...\n";
	
	open INFILE, "<$fileName" or die $!;
	
	<INFILE>; # eat header
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my $magnitude = 1;
		
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
				print STDERR
					"\nNot enough fields in $fileName.  Is it a PhymmBL result file (see -p)?\n";
				exit;
			}
			
			$scores = ();
			
			$values[1] = $values[3]; # use genus conf for species
			
			for ( my $i = 0; $i < @values; $i += 2 )
			{
				unshift @lineage, $values[$i];
				unshift @$scores, $values[$i + 1];
			}
		}
		
		if ( defined %magnitudes )
		{
			if ( defined $magnitudes{$readID} )
			{
				$magnitude = $magnitudes{$readID};
			}
			else
			{
				print STDERR "Warning: $readID doesn't exist in magnitude file; using 1.\n";
			}
		}
		
		for ( my $i = 0; $i < @lineage; $i++ )
		{
			$lineage[$i] = decode($lineage[$i]);
		}
		
		map { if ( $_ eq '' ) { $_ = 'unknown' } } @lineage;
		
#		print "@lineage\n";
		addByLineage(\%all, $set, $magnitude, \@lineage, \@ranks, $scores); # TODO: translate score to conf
	}
	
	close INFILE;
	
	if ( getOption('include') && $totalMagnitude )
	{
		$all{'magnitude'}[$set] == $totalMagnitude;
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
}

# tree output

my @attributeNames =
(
	'magnitude',
	'rank',
	'score'
);

my @attributeDisplayNames =
(
	'Total',
	'Rank',
	getOption('phymm') ? 'Avg. score' : 'Avg. confidence'
);

writeTree
(
	\%all,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	'score',
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

