package org.sakaiproject.gradebookng.tool.owl.model;

import java.io.Serializable;
import org.sakaiproject.gradebookng.business.model.GbGroup;

/**
 *
 * @author plukasew
 */
public class OwlExportConfig implements Serializable
{
	// default export options
	public boolean includeStudentName = true;
	public boolean includeStudentId = true;
	public boolean includeStudentNumber = true;
	public boolean includeGradeItemScores = true;
	public boolean includeGradeItemComments = true;
	public boolean includeFinalGrade = false;
	public boolean includePoints = false;
	public boolean includeLastLogDate = false;
	public boolean includeCalculatedGrade = false;
	public boolean includeGradeOverride = false;
	public GbGroup group = null;

	public static final OwlExportConfig DEFAULTS = new OwlExportConfig();
}
