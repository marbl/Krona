#!/usr/bin/env perl

use strict;

BEGIN
{
	use File::Basename;
	use Cwd 'abs_path';
	use lib dirname(abs_path($0)) . "/../lib";
	use KronaTools;
}

use Getopt::Long;

my $help;
my $stream;
my $tax;

GetOptions
(
	'h' => \$help,
	'help' => \$help,
	's' => \$stream,
	'tax=s' => \$tax
);

if ( defined $tax )
{
	setOption('taxonomy', $tax);
}

if ( $help )
{
	print '
Description:

   Computes the lowest common ancestor for accessions or taxonomy IDs (as
   arguments or from <stdin>). If an input is a number, it is assumed to be a
   taxonomy ID; otherwise it will be considered an accession or sequence ID
   containing an accession in the fourth field of pipe notation (e.g.
   "gi|12345|xx|ABC123.1|", ignoring fasta/fastq tag markers [>,@]). If using
   <stdin>, the LCA can be computed for the first fields of all input lines
   (default), or per input line, separated by whitespace (see -s).

Usage:

   ktGetLCA [options] [acc/tax_ID ...] [< acc/taxID_list] > LCA

Options:

   -s  Streaming mode. Each line is expected to be a whitespace-separated list 
       of inputs for a single lowest common ancestor computation. Taxonomy will
       be preloaded, allowing for faster computation after a small upfront time.

';
	exit;
}

if ( $stream )
{
	loadTaxonomy();
}

my $stdin;

if ( @ARGV == 0 || $stream )
{
	$stdin = 1;
}

my @taxIDs;

while ( my $in = $stdin ? <STDIN> : shift @ARGV )
{
	chomp $in;
	
	if ( $stream )
	{
		if ( $in eq "" )
		{
			print "\n";
			next;
		}
		
		my @taxIDs;
		
		foreach my $id (split /\s+/, $in)
		{
			my $taxID = getTaxIDFromAcc(getAccFromSeqID($id));
			
			if ( $taxID != 0 )
			{
				push @taxIDs, $taxID;
			}
		}
		
		my $lca = taxLowestCommonAncestor(@taxIDs);
		print "$lca\n";
	}
	else
	{
		my $taxID = getTaxIDFromAcc(getAccFromSeqID($in));
		
		if ( $taxID != 0 )
		{
			push @taxIDs, $taxID;
		}
	}
}

if ( ! $stream )
{
	my $lca = taxLowestCommonAncestor(@taxIDs);
	print "$lca\n";
}

printWarnings();
