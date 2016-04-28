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
		echo "updateTaxonomy.sh [--local] [--preserve] [/custom/dir]"
		exit
	elif [ $1 == "--local" ]
	then
		local=1
	elif [ $1 == "--preserve" ]
	then
		preserve=1
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
		if [ ! -e $zipped ] && [ ! -e $unzipped ]
		then
			die "Could not find $taxonomyPath/$unzipped[.gz]."
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
	
	if [ ! -e $unzipped ] || [ $zipped -nt $timestamp ]
	then
		echo ">>>>> Unzipping $description..."
		gunzip -f $zipped
		
		if [ $? != "0" ]
		then
			die "Could not unzip $taxonomyPath/$zipped."
		fi
	else
		echo ">>>>> $description is up to date."
	fi
	
	echo ""
}

ktPath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

if [ "$taxonomyPath" == "" ]
then
	taxonomyPath="$ktPath/taxonomy";
else
	if [ ! -d "$taxonomyPath" ]
	then
		if [ $local == "1" ]
		then
			die "Could not find $taxonomyPath."
		fi
		
		echo ""
		echo "Creating $taxonomyPath..."
		echo ""
		
		mkdir -p "$taxonomyPath"
		
		if [ "$?" != "0" ]
		then
			die "Could not create '$taxonomyPath'. Do you have permission?"
		fi
	fi
fi

cd $taxonomyPath;

if [ "$?" != "0" ]
then
	die "Could not enter '$taxonomyPath'. Did you run install.pl?"
fi

update gi_taxid_nucl.dmp gi_taxid.dat "GI to taxID dump (nucleotide)"
update gi_taxid_prot.dmp gi_taxid.dat "GI to taxID dump (protein)"
if [ "$local" != "1" ] || [ ! -e names.dmp ]
then
	update taxdump.tar taxonomy.tab 'Taxonomy dump'
fi

if [ -e taxdump.tar -a taxdump.tar -nt names.dmp ]
then
	tar -xf taxdump.tar
	rm taxdump.tar
fi

if [ gi_taxid_nucl.dmp -nt gi_taxid.dat ]
then
	echo ">>>>> Creating combined GI to taxID index..."
	$ktPath/scripts/indexGIs.pl .
	
	if [ "$preserve" != "1" ]
	then
		rm gi_taxid_nucl.dmp
		rm gi_taxid_prot.dmp
	fi
else
	echo ">>>>> GI index is up to date"
fi

echo ""

if [ nodes.dmp -nt taxonomy.tab ]
then
	echo ">>>>> Extracting taxonomy info..." 
	$ktPath/scripts/extractTaxonomy.pl .
else
	echo ">>>>> Taxonomy info is up to date"
fi

if [ "$preserve" != "1" ]
then
	echo
	echo ">>>>> Cleaning up..."

	if [ -e names.dmp ]
	then
		`rm *.dmp`
	fi

	clean gc.prt
	clean readme.txt
fi

echo
echo ">>>>> Finished."
echo

