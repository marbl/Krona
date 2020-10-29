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

my @options =
qw(
	out
	threshold
	includeUnk
	random
	percentIdentity
	bitScore
	summarize
	factor
);

setOption('out', 'blast.taxonomy.tab');

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	printUsage
	(
'Assigns each query in tabular BLAST results to an NCBI taxonomy ID. If the
results contain comment lines, queries with no hits will be included in the
output (with taxonomy IDs of -1 for consistency with MEGAN).',
		$KronaTools::argumentNames{'blast'},
		$KronaTools::argumentDescriptions{'blast'},
		0,
		0,
		\@options
	);
	printHeader('Output');
	printColumns
	(
		'Default:',
		'<queryID> <taxID> <score>',
		'Summarized (-s):',
		'<count> <taxID> <score>'
	);
	print "\n";
	printColumns
	(
		'   queryID',
		'The query ID as it appears in the BLAST results.',
		'   taxID',
'The NCBI taxonomy ID the query was assigned to (or -1 if it has no hits).',
		'   score',
'The score of the assignment(s); by default, the average E-value of "best" hits
(see -p, -b).',
		'   count',
		'The number of assignments.'
	);
	print "\n";
	
	exit 0;
}

# load taxonomy

print "Loading taxonomy...\n";
loadTaxonomy();

my %taxIDs;
my %scores;

# parse BLAST results

foreach my $fileName (@ARGV)
{
	print "Classifying $fileName...\n";
	classifyBlast($fileName, \%taxIDs, \%scores);
}

printWarnings();

my $outFile = getOption('out');

print "Writing $outFile...\n";

open OUT, ">$outFile" or die "Could not open $outFile for writing";

my $scoreName = getScoreName();

if ( getOption('summarize') )
{
	my %magnitudes;
	my %totalScores;
	
	print OUT "#count\ttaxID\t$scoreName\n";
	
	foreach my $queryID ( keys %taxIDs )
	{
		$magnitudes{$taxIDs{$queryID}}++;
		$totalScores{$taxIDs{$queryID}} += $scores{$queryID};
	}
	
	foreach my $taxID ( sort {$a <=> $b} keys %magnitudes )
	{
		print OUT join "\t",
		(
			$magnitudes{$taxID},
			$taxID,
			$totalScores{$taxID} / $magnitudes{$taxID}
		), "\n";
	}
}
else
{
	print OUT "#queryID\ttaxID\t$scoreName\n";
	
	foreach my $queryID ( sort keys %taxIDs )
	{
		print OUT "$queryID\t$taxIDs{$queryID}\t$scores{$queryID}\n";
	}
}

close OUT;

my $options = getOption('summarize') ? ' -m 1' : '';
my $outFile = getOption('out');

print "\nTo import, run:\n   ktImportTaxonomy$options $outFile\n\n";
