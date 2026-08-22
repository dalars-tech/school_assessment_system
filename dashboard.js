/*
========================================================
DRMS DASHBOARD.JS
========================================================

Handles:
1. Supabase authentication
2. Owner/uploader profiles
3. School statistics
4. Excel validation
5. Nine JSS learning areas
6. Points-only results
7. Individual rubrics
8. Aggregate points /72
9. Aggregate rubric
10. Learner creation/update
11. Results creation/update

Excel columns required:

Assessment Number
Learner Name
Grade
Class
Mathematics
English
Kiswahili
Integrated Science
Social Studies
CRE/IRE
Agriculture
Creative Arts and Sports
Pre-Technical Studies

Each learning-area value must be 1–8.
*/


/*
========================================================
SUPABASE CONNECTION
========================================================
*/

const SUPABASE URL=                                                                                                                                                                                                          ''https://odronoyfmxlijuuzadpc.supabase.co/rest/v1/";

const SUPABASE_KEY =
  "sb_publishable_HCyXJTwKQL1cbh5-4v54pQ_3vaY9zqd";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/*
========================================================
NINE LEARNING AREAS
========================================================
*/

const LEARNING_AREAS = [

  "Mathematics",

  "English",

  "Kiswahili",

  "Integrated Science",

  "Social Studies",

  "CRE/IRE",

  "Agriculture",

  "Creative Arts and Sports",

  "Pre-Technical Studies"

];


const REQUIRED_COLUMNS = [

  "Assessment Number",

  "Learner Name",

  "Grade",

  "Class",

  ...LEARNING_AREAS

];


let currentUser = null;

let currentProfile = null;

let selectedRows = [];


/*
========================================================
HELPER
========================================================
*/

function getElement(id) {

  return document.getElementById(id);

}


function showMessage(
  elementId,
  text,
  color = "#555"
) {

  const element =
    getElement(elementId);

  if (!element) return;

  element.textContent = text;

  element.style.color = color;

}


/*
========================================================
CHECK LOGIN
========================================================
*/

async function checkLogin() {

  const {
    data: {
      session
    },
    error
  } =
    await supabaseClient.auth.getSession();


  if (error) {

    console.error(
      "Session error:",
      error
    );

    window.location.href =
      "index.html";

    return null;

  }


  if (!session) {

    window.location.href =
      "index.html";

    return null;

  }


  currentUser =
    session.user;


  return session;

}


/*
========================================================
LOAD USER PROFILE
========================================================
*/

async function loadProfile() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("drms_profiles")
      .select(
        `
        role,
        school_id,
        schools (
          id,
          name
        )
        `
      )
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Profile error:",
      error
    );

    showMessage(
      "uploadMessage",
      "Profile error: " +
      error.message,
      "#b42318"
    );

    return null;

  }


  if (!data) {

    showMessage(
      "uploadMessage",
      "Your account has not been assigned a DRMS role.",
      "#b42318"
    );

    return null;

  }


  currentProfile =
    data;


  return data;

}


/*
========================================================
DISPLAY PROFILE
========================================================
*/

function displayProfile() {

  const role =
    currentProfile.role;


  const school =
    currentProfile.schools;


  const welcome =
    getElement("welcomeText");


  const userInfo =
    getElement("userInfo");


  const accountType =
    getElement("accountType");


  if (welcome) {

    if (role === "owner") {

      welcome.textContent =
        "DRMS Owner Dashboard";

    } else {

      welcome.textContent =
        "School Uploader Dashboard";

    }

  }


  if (userInfo) {

    let text =
      currentUser.email;


    if (school) {

      text +=
        " • " +
        school.name;

    }


    userInfo.textContent =
      text;

  }


  if (accountType) {

    accountType.textContent =
      role;

  }


  /*
  Show owner-only area
  */

  const ownerArea =
    getElement("ownerArea");


  if (ownerArea) {

    if (role === "owner") {

      ownerArea.classList.remove(
        "hidden"
      );

    } else {

      ownerArea.classList.add(
        "hidden"
      );

    }

  }

}


/*
========================================================
LOAD STATISTICS
========================================================
*/

async function loadStatistics() {

  if (!currentProfile) {
    return;
  }


  /*
  OWNER
  */

  if (
    currentProfile.role ===
    "owner"
  ) {

    const schools =
      await supabaseClient
        .from("schools")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        );


    const learners =
      await supabaseClient
        .from("learners")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        );


    const results =
      await supabaseClient
        .from("results")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        );


    if (getElement("schoolCount")) {

      getElement(
        "schoolCount"
      ).textContent =
        schools.count || 0;

    }


    if (getElement("learnerCount")) {

      getElement(
        "learnerCount"
      ).textContent =
        learners.count || 0;

    }


    if (getElement("resultCount")) {

      getElement(
        "resultCount"
      ).textContent =
        results.count || 0;

    }


    return;

  }


  /*
  UPLOADER
  */

  const schoolId =
    currentProfile.school_id;


  if (!schoolId) {

    showMessage(
      "uploadMessage",
      "Your account has no assigned school.",
      "#b42318"
    );

    return;

  }


  const learners =
    await supabaseClient
      .from("learners")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "school_id",
        schoolId
      );


  const results =
    await supabaseClient
      .from("results")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "school_id",
        schoolId
      );


  if (getElement("schoolCount")) {

    getElement(
      "schoolCount"
    ).textContent =
      "1";

  }


  if (getElement("learnerCount")) {

    getElement(
      "learnerCount"
    ).textContent =
      learners.count || 0;

  }


  if (getElement("resultCount")) {

    getElement(
      "resultCount"
    ).textContent =
      results.count || 0;

  }

}


/*
========================================================
POINT → INDIVIDUAL RUBRIC
========================================================

Because each learning area has points from 1–8:

1 = BE2
2 = BE1
3 = AE2
4 = AE1
5 = ME2
6 = ME1
7 = EE2
8 = EE1
========================================================
*/

function getPointRubric(points) {

  switch (Number(points)) {

    case 1:
      return "BE2";

    case 2:
      return "BE1";

    case 3:
      return "AE2";

    case 4:
      return "AE1";

    case 5:
      return "ME2";

    case 6:
      return "ME1";

    case 7:
      return "EE2";

    case 8:
      return "EE1";

    default:
      return null;

  }

}


/*
========================================================
AGGREGATE RUBRIC
========================================================

0–9   BE2
10–18 BE1
19–27 AE2
28–36 AE1
37–45 ME2
46–54 ME1
55–63 EE2
64–72 EE1
========================================================
*/

function getAggregateRubric(
  aggregate
) {

  const points =
    Number(aggregate);


  if (
    points >= 0 &&
    points <= 9
  ) {

    return "BE2";

  }


  if (
    points >= 10 &&
    points <= 18
  ) {

    return "BE1";

  }


  if (
    points >= 19 &&
    points <= 27
  ) {

    return "AE2";

  }


  if (
    points >= 28 &&
    points <= 36
  ) {

    return "AE1";

  }


  if (
    points >= 37 &&
    points <= 45
  ) {

    return "ME2";

  }


  if (
    points >= 46 &&
    points <= 54
  ) {

    return "ME1";

  }


  if (
    points >= 55 &&
    points <= 63
  ) {

    return "EE2";

  }


  if (
    points >= 64 &&
    points <= 72
  ) {

    return "EE1";

  }


  return null;

}


/*
========================================================
VALIDATE ONE POINT VALUE
========================================================
*/

function validatePoints(
  value
) {

  const number =
    Number(value);


  return (
    Number.isInteger(number) &&
    number >= 1 &&
    number <= 8
  );

}


/*
========================================================
CALCULATE AGGREGATE
========================================================
*/

function calculateAggregate(
  row
) {

  let total = 0;


  for (
    const area
    of LEARNING_AREAS
  ) {

    total +=
      Number(row[area]);

  }


  return total;

}


/*
========================================================
READ EXCEL
========================================================
*/

async function readExcelFile(
  file
) {

  /*
  XLSX library is loaded in
  dashboard.html.
  */

  if (
    typeof XLSX ===
    "undefined"
  ) {

    throw new Error(
      "Excel library has not loaded. Refresh the page and try again."
    );

  }


  const buffer =
    await file.arrayBuffer();


  const workbook =
    XLSX.read(
      buffer,
      {
        type: "array"
      }
    );


  if (
    !workbook.SheetNames.length
  ) {

    throw new Error(
      "The Excel file contains no worksheet."
    );

  }


  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];


  const rows =
    XLSX.utils.sheet_to_json(
      sheet,
      {
        defval: ""
      }
    );


  return rows;

}


/*
========================================================
VALIDATE EXCEL
========================================================
*/

async function validateExcel() {

  const fileInput =
    getElement("excelFile");


  const file =
    fileInput?.files?.[0];


  if (!file) {

    showMessage(
      "uploadMessage",
      "Please choose an Excel file first.",
      "#b42318"
    );

    return;

  }


  selectedRows = [];


  const uploadButton =
    getElement(
      "uploadButton"
    );


  if (uploadButton) {

    uploadButton.disabled =
      true;

  }


  showMessage(
    "uploadMessage",
    "Reading Excel file...",
    "#555"
  );


  try {

    const rows =
      await readExcelFile(
        file
      );


    if (!rows.length) {

      throw new Error(
        "The Excel file contains no data."
      );

    }


    /*
    Check column names.
    */

    const actualColumns =
      Object.keys(
        rows[0]
      );


    const missingColumns =
      REQUIRED_COLUMNS.filter(
        function(column) {

          return !actualColumns.includes(
            column
          );

        }
      );


    if (
      missingColumns.length
    ) {

      throw new Error(
        "Missing columns: " +
        missingColumns.join(
          ", "
        )
      );

    }


    const errors = [];


    /*
    Validate every learner.
    */

    rows.forEach(
      function(row, index) {

        const excelRow =
          index + 2;


        const assessment =
          String(
            row[
              "Assessment Number"
            ] ?? ""
          ).trim();


        const learnerName =
          String(
            row[
              "Learner Name"
            ] ?? ""
          ).trim();


        if (!assessment) {

          errors.push(
            `Row ${excelRow}: Assessment Number is missing.`
          );

        }


        if (!learnerName) {

          errors.push(
            `Row ${excelRow}: Learner Name is missing.`
          );

        }


        /*
        Validate all 9 points.
        */

        LEARNING_AREAS.forEach(
          function(area) {

            if (
              !validatePoints(
                row[area]
              )
            ) {

              errors.push(
                `Row ${excelRow}: ${area} must contain a point from 1 to 8.`
              );

            }

          }
        );

      }
    );


    /*
    Check duplicate assessment
    numbers inside the Excel.
    */

    const assessmentNumbers =
      rows.map(
        function(row) {

          return String(
            row[
              "Assessment Number"
            ]
          ).trim();

        }
      );


    const duplicates = [];


    assessmentNumbers.forEach(
      function(number, index) {

        if (
          assessmentNumbers.indexOf(
            number
          ) !== index
        ) {

          if (
            !duplicates.includes(
              number
            )
          ) {

            duplicates.push(
              number
            );

          }

        }

      }
    );


    if (duplicates.length) {

      errors.push(
        "Duplicate Assessment Numbers in Excel: " +
        duplicates.join(", ")
      );

    }


    /*
    Stop if validation failed.
    */

    if (errors.length) {

      showMessage(
        "uploadMessage",
        "Validation failed: " +
        errors
          .slice(0, 10)
          .join(" | ") +
        (
          errors.length > 10
            ? " ..."
            : ""
        ),
        "#b42318"
      );

      return;

    }


    /*
    Validation successful.
    */

    selectedRows =
      rows;


    if (uploadButton) {

      uploadButton.disabled =
        false;

    }


    showMessage(
      "uploadMessage",
      `Validation successful. ${rows.length} learner(s) are ready for upload.`,
      "#087443"
    );


    showPreview(
      rows
    );


  } catch (error) {

    console.error(
      "Excel validation error:",
      error
    );


    showMessage(
      "uploadMessage",
      error.message,
      "#b42318"
    );

  }

}


/*
========================================================
PREVIEW
========================================================
*/

function showPreview(
  rows
) {

  const preview =
    getElement("preview");


  if (!preview) {
    return;
  }


  let html = `

    <div style="
      overflow-x:auto;
      margin-top:20px;
    ">

    <table style="
      width:100%;
      border-collapse:collapse;
      font-size:13px;
    ">

      <thead>

        <tr>

  `;


  REQUIRED_COLUMNS.forEach(
    function(column) {

      html += `
        <th style="
          border:1px solid #ddd;
          padding:8px;
          background:#f1f5f9;
          text-align:left;
        ">
          ${escapeHtml(column)}
        </th>
      `;

    }
  );


  html += `
        </tr>
      </thead>

      <tbody>
  `;


  /*
  Show maximum 10 rows
  in preview.
  */

  rows
    .slice(0, 10)
    .forEach(
      function(row) {

        html += "<tr>";


        REQUIRED_COLUMNS.forEach(
          function(column) {

            html += `
              <td style="
                border:1px solid #ddd;
                padding:8px;
              ">
                ${escapeHtml(
                  row[column]
                )}
              </td>
            `;

          }
        );


        html += "</tr>";

      }
    );


  html += `
      </tbody>
    </table>

    </div>
  `;


  if (rows.length > 10) {

    html += `
      <p style="
        color:#777;
        font-size:13px;
      ">
        Showing first 10 of
        ${rows.length} learners.
      </p>
    `;

  }


  preview.innerHTML =
    html;

}


/*
========================================================
UPLOAD RESULTS
========================================================
*/

async function uploadResults() {

  if (
    !selectedRows.length
  ) {

    showMessage(
      "uploadMessage",
      "Validate an Excel file first.",
      "#b42318"
    );

    return;

  }


  if (!currentProfile) {

    showMessage(
      "uploadMessage",
      "Your DRMS profile could not be loaded.",
      "#b42318"
    );

    return;

  }


  const schoolId =
    currentProfile.school_id;


  /*
  Owner must select/use a school.
  Uploader already has one.
  */

  if (!schoolId) {

    showMessage(
      "uploadMessage",
      "This account has no school assigned.",
      "#b42318"
    );

    return;

  }


  const term =
    getElement("term")?.value;


  const year =
    Number(
      getElement("year")?.value
    );


  if (!term) {

    showMessage(
      "uploadMessage",
      "Please select a term.",
      "#b42318"
    );

    return;

  }


  if (
    !Number.isInteger(year) ||
    year < 2000
  ) {

    showMessage(
      "uploadMessage",
      "Enter a valid academic year.",
      "#b42318"
    );

    return;

  }


  const uploadButton =
    getElement(
      "uploadButton"
    );


  if (uploadButton) {

    uploadButton.disabled =
      true;

  }


  showMessage(
    "uploadMessage",
    "Uploading results...",
    "#555"
  );


  try {

    /*
    Process learners one by one.
    */

    for (
      let i = 0;
      i < selectedRows.length;
      i++
    ) {

      const row =
        selectedRows[i];


      const assessmentNumber =
        String(
          row[
            "Assessment Number"
          ]
        ).trim();


      const learnerName =
        String(
          row[
            "Learner Name"
          ]
        ).trim();


      const grade =
        String(
          row["Grade"]
        ).trim();


      const className =
        String(
          row["Class"]
        ).trim();


      /*
      ================================================
      FIND EXISTING LEARNER
      ================================================
      */

      let {
        data: learner,
        error: learnerSearchError
      } =
        await supabaseClient
          .from("learners")
          .select("id")
          .eq(
            "school_id",
            schoolId
          )
          .eq(
            "assessment_number",
            assessmentNumber
          )
          .maybeSingle();


      if (
        learnerSearchError
      ) {

        throw learnerSearchError;

      }


      /*
      ================================================
      CREATE OR UPDATE LEARNER
      ================================================
      */

      if (learner) {


        const {
          error
        } =
          await supabaseClient
            .from("learners")
            .update({

              learner_name:
                learnerName,

              grade:
                grade,

              class_name:
                className

            })
            .eq(
              "id",
              learner.id
            );


        if (error) {

          throw error;

        }

      } else {


        const {
          data:
            newLearner,

          error
        } =
          await supabaseClient
            .from("learners")
            .insert({

              school_id:
                schoolId,

              assessment_number:
                assessmentNumber,

              learner_name:
                learnerName,

              grade:
                grade,

              class_name:
                className

            })
            .select(
              "id"
            )
            .single();


        if (error) {

          throw error;

        }


        learner =
          newLearner;

      }


      /*
      ================================================
      PREPARE THE NINE RESULTS
      ================================================
      */

      const resultsPayload =
        [];


      let aggregate =
        0;


      LEARNING_AREAS.forEach(
