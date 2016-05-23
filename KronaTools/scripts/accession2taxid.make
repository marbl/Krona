ACC2TAXID=\
	dead_nucl.accession2taxid \
	dead_prot.accession2taxid \
	dead_wgs.accession2taxid \
	nucl_est.accession2taxid \
	nucl_gb.accession2taxid \
	nucl_gss.accession2taxid \
	nucl_wgs.accession2taxid \
	prot.accession2taxid

ACC2TAXID_SORTED=$(ACC2TAXID:.accession2taxid=.accession2taxid.sorted)

../all.accession2taxid.sorted : $(ACC2TAXID_SORTED)
	@echo "Merging sorted..."
	@LC_ALL=C sort -m $(ACC2TAXID_SORTED) > $@
	@rm $(ACC2TAXID_SORTED)

SORT := grep -v accession | sed 's/\.[[:digit:]]*//' | LC_ALL=C sort

%.accession2taxid.sorted : %.accession2taxid
	@echo "Sorting $<..."
	@cut -f 2,3 $< | ${SORT} > $@
ifneq ("${PRESERVE}", "1")
	@rm $<
endif

%.accession2taxid.sorted : %.accession2taxid.gz
	@echo "Sorting $<..."
	@gunzip -c $< | cut -f 2,3 | ${SORT} > $@
ifneq ("${PRESERVE}", "1")
	@rm $<
endif
