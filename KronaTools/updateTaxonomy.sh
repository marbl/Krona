#! /bin/bash

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

if [ "$(uname)" == "Darwin" ]
then
    MD5="md5 -r"
else # Assume linux
    MD5=md5sum
fi

# This would not resolve symlink:
# ktPath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
# Therefore this:
# perl function to resolve symlinks that will function on Linux and OSX (since 'readlink -f' is different under OSX)
readlink_f(){ perl -MCwd -e 'print Cwd::abs_path shift' "$1";}
ktPath=$(dirname $(readlink_f $0))

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
	elif [ $1 == "--accessions" ]
	then
		accessions=1
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
	
	timestring=""
	depDesc=""
	
	if [ "$retry" != "1" ]
	then
		for dep in $name $timeDependencies
		do
			if [ -s "$dep" ]
			then
				timestring=" -z $dep"
				depDesc=" (if newer than $dep)"
				break
			fi
		done
	fi
	
	echo "Fetching $description$depDesc..."
	
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

if [ "$accessions" == "1" ] && [ ! -d "$taxonomyPath/accession2taxid" ]
then
	mkdir -p "$taxonomyPath/accession2taxid"

	if [ "$?" != "0" ]
	then
		die "Could not create '$taxonomyPath/accession2taxid'. Do you have permission?"
	fi
fi

cd $taxonomyPath

if [ "$?" != "0" ]
then
	die "Could not enter '$taxonomyPath'."
fi

ACC2TAXID="
accession2taxid/dead_nucl.accession2taxid
accession2taxid/dead_prot.accession2taxid
accession2taxid/dead_wgs.accession2taxid
accession2taxid/nucl_gb.accession2taxid
accession2taxid/nucl_wgs.accession2taxid
accession2taxid/prot.accession2taxid
"

if [ "$local" != "1" ]
then
	if [ "$accessions" == "1" ]
	then
		fetchAll="$localPull"
		
		if [ "$fetchAll" == "" ] && [ ! -e all.accession2taxid.sorted ]
		then
			fetchAll=1
		fi
		
		# if any are fetched by timestamp of all.accession2taxid.sorted, all
		# others must be fetched to rebuild it
		#
		if [ "$fetchAll" == "" ]
		then
			for unzipped in $ACC2TAXID
			do
				fetch $unzipped.gz $unzipped.gz "" "$unzipped all.accession2taxid.sorted"
				
				if [ -e $unzipped.gz ]
				then
					if [ ! -e all.accession2taxid.sorted ] || [ $unzipped.gz -nt all.accession2taxid.sorted ]
					then
						fetchAll=1
					fi
				fi
			done
		fi
		#
		if [ "$fetchAll" == "1" ]
		then
			for unzipped in $ACC2TAXID
			do
				if [ "$localPull" == "1" ] || [ ! -e $unzipped.gz ] && [ ! -e $unzipped ]
				then
					fetch $unzipped.gz $unzipped.gz "" $unzipped
				fi
			done
		fi
	else
		fetch taxdump.tar.gz "taxdump.tar.gz" "" "taxdump.tar names.dmp taxonomy.tab"
	fi
fi

if [ "$localPull" == "1" ]
then
	echo
	echo "Fetching finished."
	echo
	exit
fi

if [ "$accessions" == "1" ]
then
	for base in $ACC2TAXID
	do
		if [ ! -e $base ] && [ ! -e $base.gz ]
		then
			if [ "$local" == "1" ]
			then
				die "Could not find accession2taxid source files in $taxonomyPath."
			else
				echo "Accessions up to date."
				exit 0
			fi
		fi
	done
	
	cd accession2taxid
	
	make -j 4 PRESERVE="$preserve" -f $ktPath/$makefileAcc2taxid

	if [ "$?" != "0" ]
	then
		die "Building accession2taxid failed (see errors above). Issues can be tracked and reported at https://github.com/marbl/Krona/issues."
	fi
else
	if [ -e taxdump.tar ] || [ -e taxdump.tar.gz ] || [ -e names.dmp ]
	then
		make KTPATH="$ktPath" PRESERVE="$preserve" -f $ktPath/$makefileTaxonomy

		if [ "$?" != "0" ]
		then
			die "Building taxonomy table failed (see errors above). Issues can be tracked and reported at https://github.com/marbl/Krona/issues."
		fi
	elif [ "$local" == "1" ]
	then
		die "Could not find taxonomy source files in $taxonomyPath."
	fi
fi

if [ "$preserve" != "1" ]
then
	echo
	echo "Cleaning up..."

	if [ "$accessions" != "1" ]
	then
		make -f $ktPath/$makefileTaxonomy clean
	else
		rmdir $ktPath/taxonomy/accession2taxid 2> /dev/null
	fi
fi

echo
echo "Finished."
echo
