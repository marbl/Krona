#!/usr/bin/env perl

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

use Krona;

if ( @ARGV < 3 )
{
	print "differentiate.pl <target_taxID> <bg_taxID> <blast...>\n";
	exit;
}

my ($target, $bg, @files) = @ARGV;

my @totals;

loadTaxonomy();

foreach my $file ( @files )
{
	open BLAST, "<$file";
	
	my $lastQueryID;
	my $topScore;
	
	# 0 = top hit, 1 = hit, 2 = no hit
	#
	my $targetHit;
	my $bgHit;
	
	while ( 1 )
	{
		my $line = <BLAST>;
		
		chomp $line;
		
		if ( $line =~ /^#/ )
		{
			next;
		}
		
		my
		(
			$queryID,
			$hitID,
			$identity,
			$length,
			$mismatches,
			$gaps,
			$queryStart,
			$queryEnd,
			$subjectStart,
			$subjectEnd,
			$eVal,
			$bitScore
		) = split /\t/, $line;
		
		if ( $queryID ne $lastQueryID && defined $lastQueryID )
		{
			$totals[$bgHit][$targetHit]++;
			#print "$targetHit\t$bgHit\n\n";
		}
		
		if ( ! defined $hitID )
		{
			last; # EOF
		}
		
		$hitID =~ /gi\|(\d+)/;
		
		my $gi = $1;
		
		my $taxID = getTaxID($gi);
		my $name = getName($taxID);
		
		#print "$queryID\t$taxID\t$bitScore\t$name\n";
		
		if ( $queryID ne $lastQueryID )
		{
			$topScore = $bitScore;
			$targetHit = 2;
			$bgHit = 2;
		}
		
		if ( contains($target, $taxID) )
		{
			if ( $bitScore == $topScore )
			{
				$targetHit = 0;
			}
			elsif ( $targetHit == 2 )
			{
				$targetHit = 1;
			}
		}
		elsif ( contains($bg, $taxID) )
		{
			if ( $bitScore == $topScore )
			{
				$bgHit = 0;
			}
			elsif ( $bgHit == 2 )
			{
				$bgHit = 1;
			}
		}
		
		$lastQueryID = $queryID;
	}
}

print ",,,Human\n";
print ",,top hit,hit,no hit\n";
print ",top hit,", join(',', @{$totals[0]}), "\n";
print "NHP,hit,", join(',', @{$totals[1]}), "\n";
print ",no hit,", join(',', @{$totals[2]}), "\n";
