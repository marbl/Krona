#! /usr/bin/perl

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
use File::Basename;

my $otherName = '[Other small files or folders]';

setOption('out', 'du.krona.html');

my @options =
qw(
	out
	local
	url
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	print '

ktImportDiskUsage.pl [options] <dir>

';
	printOptions(@options);
	exit;
}

my %all;
my ($path) = @ARGV;
my $time = time;

setOption('name', basename(abs_path($path)) . '/');
setOption('collapse', 0);
setOption('color', 0);

my $total = `du -sk $path 2> /dev/null` * 1024;

my @units =
qw(
	bytes
	Kb
	Mb
	Gb
	Tb
);

my @unitSizes =
(
	2**0,
	2**10,
	2**20,
	2**30,
	2**40
);

my $unit = int((log $total) / (log 2) / 10 - 1);
my $unitSize = $unitSizes[$unit];

$total /= $unitSize;

add(\%all, abs_path($path));

my @attributeNames =
(
	'magnitude',
	'files',
	'score',
	'age'
);

my @attributeDisplayNames =
(
	"Size ($units[$unit])",
	'Files',
	'Log age (log of days since modified)',
	'Age (days since modified)'
);

my @datasetNames;

writeTree
(
	\%all,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	'score',
	300,
	240
);

my $outFile = getOption('out');
#system("open $outFile");

sub add
{
	my $child;
	my ($node, $dir) = @_;
	
	if ( ! defined ${$node}{'children'} )
	{
		${$node}{'children'} = ();
		${$node}{'href'}[0] = 'file://localhost' . $dir;
	}
	
	my @stats = stat $dir;
	my $age = ($time - $stats[9]) / 86400;
	
	if ( $age < 0 )
	{
		$age = 0;
	}
	
	${$node}{'scoreTotal'}[0] = log ($age + 1) / log 10;
	${$node}{'scoreCount'}[0] = 1;
	${$node}{'age'}[0] = int($age);
	
	if ( -d $dir && (! -l $dir) && opendir DIR, $dir )
	{
		my @files = readdir DIR;
		closedir DIR;
		
		foreach my $file ( @files )
		{
			if ( $file eq '.' || $file eq '..' )
			{
				next;
			}
			
			my $childPath = "$dir/$file";
			
			if ( -d $childPath )
			{
				$file .= '/';
			}
			
			if ( ! defined ${$node}{'children'}{$file} )
			{
				my %newHash = ();
				${$node}{'children'}{$file} = \%newHash;
			}
			
			$child = ${$node}{'children'}{$file};
			
			my $childMag = add($child, $childPath);
			
			${$node}{'magnitude'}[0] += $childMag;
			${$node}{'files'}[0] += ${$child}{'files'}[0];
			
			if ( $childMag < $total / 1000 )
			{
				${$node}{'children'}{$otherName}{'magnitude'}[0] += $childMag;
				my $otherChild = ${$node}{'children'}{$otherName};
				
				if
				(
					! defined ${$otherChild}{'age'} ||
					${$otherChild}{'age'}[0] > ${$child}{'age'}[0]
				)
				{
					${$otherChild}{'files'}[0]++;
					${$otherChild}{'age'}[0] = ${$child}{'age'}[0];
					${$otherChild}{'scoreTotal'}[0] = ${$child}{'scoreTotal'}[0];
					${$otherChild}{'scoreCount'}[0] = 1;
				}
				
				delete ${$node}{'children'}{$file};
			}
		}
	}
	else
	{
		${$node}{'magnitude'}[0] = int($stats[7] / $unitSize);
		${$node}{'files'}[0] += 1;
	}
	
	return ${$node}{'magnitude'}[0];
}
