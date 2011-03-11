#! /bin/bash

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


oldPath=$(pwd)

taxonomyPath=./taxonomy;
cd $taxonomyPath;

function update
{
	unzipped=$1
	description=$2
	
	zipped=${unzipped}.gz
	
	echo
	echo ">>>>> Updating $description..."
	echo
	
	curl -R -z $unzipped -o $zipped ftp://ftp.ncbi.nih.gov/pub/taxonomy/$zipped
	
#	chmod 644 $zipped # allow wget to overwrite later
	
	if [ -e $zipped ]
	then
		echo "     >>>>> Unzipping $description..."
		gunzip -f $zipped
	fi
	
	echo
	echo "     >>>>> $description is up to date."
	echo
}

update gi_taxid_nucl.dmp "GI to taxID dump (nucleotide)"
update gi_taxid_prot.dmp "GI to taxID dump (protein)"
update taxdump.tar 'Taxonomy dump'
tar -xf taxdump.tar
rm taxdump.tar

cd $oldPath

if [ taxonomy/gi_taxid_nucl.dmp -nt taxonomy/gi_taxid.dat ]
then
	echo ">>>>> Creating combined GI to taxID index..."
	./scripts/indexGIs.pl
else
	echo ">>>>> GI index is up to date"
fi

if [ taxonomy/nodes.dmp -nt taxonomy/taxonomy.tab ]
then
	echo ">>>>> Extracting node info..." 
	./scripts/extractTaxonomy.pl
else
	echo ">>>>> Node info is up to date"
fi

echo
echo ">>>>> Finished."
echo
