#! /bin/bash

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

command -v curl >/dev/null 2>&1 || \
	{ echo >&2 "ERROR: Curl (http://curl.haxx.se) is required."; exit 1; }

while [ "$#" -ne 0 ]
do
	if [ $1 == "--help" ] || [ $1 == "-h" ]
	then
		echo "updateTaxonomy.sh [--local] [/custom/dir]"
		exit
	elif [ $1 == "--local" ]
	then
		local=1
	else
		taxonomyPath=$1
	fi
	
	shift
done

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
	
	if [ -e $aFile ]
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
	
	if [ $local ]
	then
		if [ ! -e $zipped ]
		then
			die "Could not find $taxonomyPath/$zipped.  Was it transfered?"
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
			die "Could not write '$taxonomyPath/$zipped'. Do you have permission?"
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
			die "Could not unzip $taxonomyPath/$zipped. Do you have permission?"
		fi
	else
		echo ">>>>> $description is up to date."
	fi
	
	echo ""
}

oldPath=`ktGetLibPath`/..

if [ "$taxonomyPath" == "" ]
then
	taxonomyPath="$oldPath/taxonomy";
else
	if [ ! -d "$taxonomyPath" ]
	then
		echo ""
		echo "Creating $taxonomyPath..."
		echo ""
		
		mkdir -p "$taxonomyPath"
	fi
fi

cd $taxonomyPath;

if [ "$?" != "0" ]
then
	die "Could not enter '$oldPath/taxonomy'. Did you run install.pl?"
fi

update gi_taxid_nucl.dmp gi_taxid.dat "GI to taxID dump (nucleotide)"
update gi_taxid_prot.dmp gi_taxid.dat "GI to taxID dump (protein)"
update taxdump.tar taxonomy.tab 'Taxonomy dump'

if [ -e taxdump.tar ]
then
	tar -xf taxdump.tar
	rm taxdump.tar
fi

if [ $taxonomyPath/gi_taxid_nucl.dmp -nt $taxonomyPath/gi_taxid.dat ]
then
	echo ">>>>> Creating combined GI to taxID index..."
	$oldPath/scripts/indexGIs.pl $taxonomyPath
	rm $taxonomyPath/gi_taxid_nucl.dmp
	rm $taxonomyPath/gi_taxid_prot.dmp
else
	echo ">>>>> GI index is up to date"
fi

echo ""

if [ $taxonomyPath/nodes.dmp -nt $taxonomyPath/taxonomy.tab ]
then
	echo ">>>>> Extracting taxonomy info..." 
	$oldPath/scripts/extractTaxonomy.pl $taxonomyPath
else
	echo ">>>>> Taxonomy info is up to date"
fi

echo
echo ">>>>> Cleaning up..."

if [ -e $taxonomyPath/names.dmp ]
then
	`rm $taxonomyPath/*.dmp`
fi

clean $taxonomyPath/gc.prt
clean $taxonomyPath/readme.txt

echo
echo ">>>>> Finished."
echo

