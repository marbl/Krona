#! /usr/bin/perl

# converts the large text files into uniform records so they can be randomly
# accessed instead of slow serial searches

use strict;

indexGI();

sub indexGI
{
	# GIs are unique across nucleotide and protein records, so we want to
	# combine the taxid lists into one file in which each taxid is a 4 byte
	# field and missing GIs have blank fields to preserve position.
	
	my ($file) = @_;
	
	open NUC, "<taxonomy/gi_taxid_nucl.dmp" or die $!;
	open PRO, "<taxonomy/gi_taxid_prot.dmp" or die $!;
	
	open OUT, ">taxonomy/gi_taxid.dat" or die $!;
	
	my $lastGI = -1;
	my $giNuc;
	my $giPro;
	my $taxIDNuc;
	my $taxIDPro;
	
	# initalize records
	#
	($giNuc, $taxIDNuc) = getRecord(\*NUC);
	($giPro, $taxIDPro) = getRecord(\*PRO);
	
	while ( defined $giNuc || defined $giPro )
	{
		my $gi;
		my $taxID;
		
		# Use the record with the smallest gi and advance to the next record
		# from its file.
		#
		if ( ! defined $giPro || defined $giNuc && $giNuc < $giPro )
		{
			$gi = $giNuc;
			$taxID = $taxIDNuc;
			
			($giNuc, $taxIDNuc) = getRecord(\*NUC);
		}
		else
		{
			$gi = $giPro;
			$taxID = $taxIDPro;
			
			($giPro, $taxIDPro) = getRecord(\*PRO);
		}
		
		# fill in GIs that weren't listed with 0s
		#
		for ( my $i = $lastGI + 1; $i < $gi; $i++ )
		{
			print OUT pack "L", 0;
		}
		
		print OUT pack "L", int($taxID);
		
		$lastGI = $gi;
	}
	
	close OUT;
	
	close PRO;
	close NUC;
}

sub getRecord
{
	my $fh = shift;
	return split /\t/, <$fh>;
}
