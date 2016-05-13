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

my $AMPHORA_MIN_CONFIDENCE = 0.15;
my %TAXONOMIC_ORDERING = ( 
		"no rank" => 0,
		"domain" => 1,
		"superkingdom" => 1.9,
		"kingdom" => 2,
		"subkingdom" => 2.5,
		"superphylum" => 2.9,
		"phylum" => 3,
		"subphylum" => 3.5,
		"superclass" => 3.9,
		"class" => 4,
		"subclass" => 4.5,
		"superorder" => 4.9,
		"order" => 5,
		"suborder" => 5.5,
		"superfamily" => 5.9,
		"family" => 6,
		"subfamily" => 6.5,
		"supergenus" => 6.9,
		"genus" => 7.0,
		"subgenus" => 7.5,
		"superspecies" => 7.9,
		"species" => 8.5,
		"subspecies" => 9,
);

my $totalMag;

setOption('out', 'report.krona.html');
setOption('name', 'Root');

my @options =
qw(
	out
	include
	combine
	hueBad
	hueGood
	local
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	printUsage
	(
		'Infers taxonomic abundance from Amphora results.',
		'amphora_output',
		'Amphora output.',
		1,
		1,
		\@options
	);
	
	exit 0;
}

my $tree = newTree();

# load taxonomy

print "Loading taxonomy...\n";
loadTaxonomy();

# parse BLAST results

my $set = 0;
my @datasetNames;
my $zeroEVal;
my $useMag;

foreach my $input (@ARGV)
{
	my $totalMagnitude;
	
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $1;
	}
	
	my %magnitudes;
	
	# load magnitudes
	
	if ( defined $magFile )
	{
		print "   Loading magnitudes from $magFile...\n";
		loadMagnitudes($magFile, \%magnitudes);
		$useMag = 1;
	}
	
	print "Importing $fileName...\n";
	 
	open BLAST, "<$fileName";
        my $annotFile = $magFile;
        #print "$annotFile\n";
        $annotFile =~ s/contig.cvg/annots/;
        #print "$annotFile\n";
        $annotFile = getOption('out') . '.ann';
        open ANNOTS, ">$annotFile" or die $!;

	my $topScore;
	my $ties;
        my $taxID = undef;
        my $currCtg = undef;
	my $magnitude = 0;
        my %bestTaxa;
        my %bestScores;

        print ANNOTS "contigID\tclassID\n";
	while ( 1 )
	{
		my $line = <BLAST>;
		
		chomp $line;
                #print "$line";
		my
		(
                        $contigID,
			$taxID,
                        $taxLevel,
			$taxaName,
			$score

		) = split /\t/, $line; #split /\t/, $line;
                if (!defined($contigID) || (defined($currCtg) && !($currCtg eq $contigID))) {
                   my $magnitude = 1;
                   if (defined($magnitudes{$currCtg})) {
                      $magnitude = $magnitudes{$currCtg}
                    }
                    # pick the best level to use
                    my $bestTaxon;
                    my $bestName;
                    my $printed = 0;

                    foreach my $taxa (keys %bestScores) {
                       #print "$taxa\n";
                       if ($printed == 0 && $taxa eq "class")
                       {
                           $printed = 1;
                           print ANNOTS "$currCtg\t$bestTaxa{$taxa}\n";
                       }

                       if ($bestScores{$taxa} > $AMPHORA_MIN_CONFIDENCE) {
                          if (!defined($bestTaxon)) {
                             $bestTaxon = $bestTaxa{$taxa};
                             $bestName = $taxa;
                          } else {
                             if ($TAXONOMIC_ORDERING{$bestName} < $TAXONOMIC_ORDERING{$taxa}) {
                                   $bestTaxon = $bestTaxa{$taxa};
                                   $bestName = $taxa;
                        
                             }
                          }
                       }
                    }
                    print "$currCtg\t$bestTaxon\n";
                    addByTaxID($tree, $set, $bestTaxon, $currCtg, $magnitude, $bestScores{$bestName});
                    $totalMagnitude += $magnitude;
                    %bestScores = ();
                    %bestTaxa = ();
                }

                if ( ! defined $taxID )
                {
                        last; # EOF
                }
                if ( defined $taxID )
		{
                        if (!defined($bestScores{$taxLevel}) || $bestScores{$taxLevel} < $score) {
                           $bestScores{$taxLevel} = $score;
                           $bestTaxa{$taxLevel} = $taxID;
                        }
                        $currCtg = $contigID; 
		}
	}
	
	if ( getOption('include') && $totalMagnitude )
	{
		$$tree{'magnitude'}[$set] = $totalMagnitude; # TODO: this should be changed to an add()
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
}

if ( $zeroEVal )
{
	print "\nWARNING: Couldn't take log for e-values of 0.  Used 1e-413.\n\n";
}

my @attributeNames =
(
	'magnitude',
	'count',
	'unassigned',
	'taxon',
	'rank',
	'score',
);

my @attributeDisplayNames =
(
	$useMag ? 'Total' : undef,
	'Count',
	'Unassigned',
	'Taxon',
	'Rank',
	'Confidence',
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
