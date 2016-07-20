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
my $totalMag;
my $prepend;
my $append;
my $tax;

GetOptions
(
	'h' => \$help,
	'help' => \$help,
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

   Retrieves taxonomy information for accessions or taxonomy IDs (as arguments
   or the first field of <stdin>, separated by whitespace). If the input is a
   number, it is assumed to be a taxonomy ID; otherwise it will be considered an
   accession or sequence ID containing an accession in the fourth field of pipe
   notation (e.g. "gi|12345|xx|ABC123.1|", ignoring fasta/fastq tag markers
   [>,@]). If taxonomy information was not found for a given input line, the
   output line will be only the taxonomy ID, which will be 0 if it was
   looked up from an accession but not found.

Usage:

   ktGetTaxInfo [IDs ...] [< ID_list] > tax_info

   Command line example:

      ktGetTaxInfo A00001.1 "gi|2|emb|A00002.1|" 9606

   Fasta tag example:

      grep ">" sequence.fasta | ktGetTaxInfo

';
	exit;
}

print "#taxID\tdepth\tparent\trank\tname\n";

my $stdin;

if ( @ARGV == 0 )
{
	$stdin = 1;
}

while ( my $in = $stdin ? <STDIN> : shift @ARGV )
{
	chomp $in;
	
	if ( $in eq "" )
	{
		print "\n";
		next;
	}
	
	print join "\t", getTaxInfo(getTaxIDFromAcc(getAccFromSeqID($in)));
	print "\n";
}

printWarnings();
