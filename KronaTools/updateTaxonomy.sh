#! /bin/bash

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

local=$1

function die
{
	echo ""
	echo ">>>>> Update failed."
	echo "      $1"
	echo ""
	exit 1
}

function clean
{
	aFile=$1
	
	if [ -e "$aFile" ]
	then
		rm $aFile
	fi
}

function update
{
	unzipped=$1
	timestamp=$2
	description=$3
	
	zipped=${unzipped}.gz
	
	echo ">>>>> Updating $description..."
	
	if [ $local ] && [ $local == "--local" ]
	then
		if [ ! -e $zipped ]
		then
			die "Could not find $oldPath/taxonomy/$zipped.  Was it transfered?"
		fi
	else
        if [ -e $timestamp ]
        then
            timestring=" -z $timestamp"
        fi
		
		curl$timestring -R --retry 1 -o $zipped ftp://ftp.ncbi.nih.gov/pub/taxonomy/$zipped
		return=$?
		
		if [ $return == "23" ]
		then
			die "Could not write '$oldPath/taxonomy/$zipped'. Do you have permission?"
		fi
		
		if [ $return != "0" ]
		then
			die "Is your internet connection okay?"
		fi
	fi
	
	if [ $zipped -nt $timestamp ]
	then
		echo ">>>>> Unzipping $description..."
		gunzip -f $zipped
		
		if [ $? != "0" ]
		then
			die "Could not unzip $oldPath/taxonomy/$zipped. Do you have permission?"
		fi
	else
		echo ">>>>> $description is up to date."
	fi
	
	echo ""
}

oldPath=$(pwd)
taxonomyPath=./taxonomy;
cd $taxonomyPath;

if [ "$?" != "0" ]
then
	die "Could not enter '$oldPath/taxonomy'.  Did you run install.pl?"
fi

update gi_taxid_nucl.dmp gi_taxid.dat "GI to taxID dump (nucleotide)"
update gi_taxid_prot.dmp gi_taxid.dat "GI to taxID dump (protein)"
update taxdump.tar taxonomy.tab 'Taxonomy dump'

if [ -e taxdump.tar ]
then
	tar -xf taxdump.tar
	rm taxdump.tar
fi

cd $oldPath

if [ taxonomy/gi_taxid_nucl.dmp -nt taxonomy/gi_taxid.dat ]
then
	echo ">>>>> Creating combined GI to taxID index..."
	./scripts/indexGIs.pl
	rm taxonomy/gi_taxid_nucl.dmp
	rm taxonomy/gi_taxid_prot.dmp
else
	echo ">>>>> GI index is up to date"
fi

echo ""

if [ taxonomy/nodes.dmp -nt taxonomy/taxonomy.tab ]
then
	echo ">>>>> Extracting taxonomy info..." 
	./scripts/extractTaxonomy.pl
else
	echo ">>>>> Taxonomy info is up to date"
fi

echo
echo ">>>>> Cleaning up..."

clean taxonomy/*.dmp
clean taxonomy/gc.prt
clean taxonomy/readme.txt

echo
echo ">>>>> Finished."
echo

