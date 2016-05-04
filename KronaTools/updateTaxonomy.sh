#! /bin/bash

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

MD5="md5 -r" # TODO: linux
makefileAcc2taxid="scripts/accession2taxid.make"
makefileTaxonomy="scripts/taxonomy.make"

command -v curl >/dev/null 2>&1 || \
	{ echo >&2 "ERROR: Curl (http://curl.haxx.se) is required."; exit 1; }

while [ "$#" -ne 0 ]
do
	if [ $1 == "--help" ] || [ $1 == "-h" ]
	then
		echo
		echo "updateTaxonomy.sh [options...] [/custom/dir]"
		echo
		echo "   [/custom/dir]  Taxonomy will be built in this directory instead of the"
		echo "                  directory specified during installation. This custom"
		echo "                  directory can be referred to with -tax in import scripts."
		echo
		echo "   --only-fetch   Only download source files; do not build."
		echo
		echo "   --only-build   Assume source files exist; do not fetch."
		echo
		echo "   --preserve     Do not remove source files after build."
		echo
		exit
	elif [ $1 == "--only-fetch" ]
	then
		localPull=1
	elif [ $1 == "--only-build" ]
	then
		local=1
	elif [ $1 == "--preserve" ]
	then
		preserve=1
	elif [ "${1:0:1}" == "-" ]
	then
		echo "Unrecognized option: \"$1\". See help (--help or -h)"
		exit
	else
		taxonomyPath=$1
	fi
	
	shift
done

function die
{
	echo
	echo "Update failed."
	echo "   $1"
	echo
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

function fetch
{
	name="$1"
	description="$2"
	prefix="$3"
	timeDependencies="$4"
	retry="$5"
	
	echo "Fetching $description..."
	
	timestring=""
	
	if [ "$retry" != "1" ]
	then
		for dep in $name $timeDependencies
		do
			if [ -s "$dep" ]
			then
				timestring=" -z $dep"
				break
			fi
		done
	fi
	
	curl$timestring -s -R --retry 1 -o $name ftp://ftp.ncbi.nih.gov/pub/taxonomy/$prefix/$name
	return=$?
	
	if [ $return == "23" ]
	then
		die "Could not write '$taxonomyPath/$name'. Do you have permission?"
	fi
	
	if [ $return != "0" ]
	then
		die "Is your internet connection okay?"
	fi
	
	if [ -e "$name" ]
	then
		echo "   Fetching checksum..."
		
		curl -s -R --retry 1 -o $name.md5 ftp://ftp.ncbi.nih.gov/pub/taxonomy/$prefix/$name.md5
		checksum=$($MD5 $name | cut -d ' ' -f 1)
		checksumRef=$(cut -d ' ' -f 1 $name.md5)
		rm $name.md5
		
		if [ $checksum == $checksumRef ]
		then
			echo "   Checksum for $name matches server."
		else
			if [ "$retry" == "1" ]
			then
				die "Checksum for $name still does not match server after retry."
			else
				echo "Checksum for $name does not match server. Retrying..."
				fetch "$name" "$description" "$prefix" "$timeDependcies" 1
			fi
		fi
	fi
}

if [ "$local" == "1" ] && [ "$localPull" == "1" ]
then
	die "Cannot use --only-fetch with --only-build."
fi

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
		
		echo
		echo "Creating $taxonomyPath..."
		echo
		
		mkdir -p "$taxonomyPath"
		
		if [ "$?" != "0" ]
		then
			die "Could not create '$taxonomyPath'. Do you have permission?"
		fi
	fi
fi

cd $taxonomyPath

if [ "$?" != "0" ]
then
	die "Could not enter '$taxonomyPath'. Did you run install.pl?"
fi

ACC2TAXID="
dead_nucl.accession2taxid
dead_prot.accession2taxid
dead_wgs.accession2taxid
nucl_est.accession2taxid
nucl_gb.accession2taxid
nucl_gss.accession2taxid
nucl_wgs.accession2taxid
prot.accession2taxid
"

if [ "$local" != "1" ]
then
	for unzipped in $ACC2TAXID
	do
		fetch $unzipped.gz $unzipped.gz accession2taxid "$unzipped all.accession2taxid.sorted"
	done
	
	fetch taxdump.tar.gz "Taxonomy dump" "" "taxdump.tar names.dmp taxonomy.tab"
fi

if [ "$localPull" == "1" ]
then
	echo
	echo "Fetching finished."
	echo
	exit
fi

make -j 4 PRESERVE="$preserve" -f $ktPath/$makefileAcc2taxid

if [ "$?" != "0" ]
then
	die "Building accession2taxid failed. Issues can be tracked and reported at https://github.com/marbl/Krona/issues."
fi

if [ -e taxdump.tar ] || [ -e taxdump.tar.gz ]
then
	make KTPATH="$ktPath" PRESERVE="$preserve" -f $ktPath/$makefileTaxonomy
	
	if [ "$?" != "0" ]
	then
		die "Building taxonomy table failed. Issues can be tracked and reported at https://github.com/marbl/Krona/issues."
	fi
fi

if [ "$preserve" != "1" ]
then
	echo
	echo "Cleaning up..."
	
	make -f $ktPath/$makefileAcc2taxid clean
	make -f $ktPath/$makefileTaxonomy clean
fi

echo
echo "Finished."
echo

