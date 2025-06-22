// src/pages/InstructionPopup.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/InstructionPopup.css"; // Ensure this CSS file exists and is linked

const InstructionPopup = () => {
  const { testId } = useParams();
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const popupRef = useRef(null);

  // Focus on the popup when it mounts for accessibility
  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.focus();
    }
  }, []);

  const handleStart = () => {
    if (!agreed) {
      alert("Please read and accept the declaration to proceed.");
      return;
    }
    // Navigate to the test page, replacing the current history entry
    // so the user can't go back to instructions with the browser back button
    navigate(`/test/${testId}`, { replace: true });
  };

  return (
    <div className="instruction-popup-overlay">
      <div
        className="instruction-popup-content"
        ref={popupRef}
        tabIndex="-1" // Make the div focusable
        aria-labelledby="instruction-popup-title"
      >
        <h1 id="instruction-popup-title" className="instruction-popup-title">
          Important Test Instructions
        </h1>
        <p className="instruction-popup-description">
          Please read these instructions carefully before you begin the test.
          Understanding these guidelines will help ensure a smooth and fair
          examination experience.
        </p>

        <div className="instruction-section">
          <h2>General Guidelines</h2>
          <ul className="instruction-list">
            <li>
              The total duration of the examination will be specified on the
              test page.
            </li>
            <li>
              A **countdown timer** will be displayed in the top-right corner of
              your screen, showing the remaining time. When the timer reaches
              zero, the test will automatically end and submit. You do not need
              to manually submit.
            </li>
            <li>
              This test consists of **Multiple Choice Questions (MCQ)** , **Multiple Select Questions (MSQ)** , and
              **Numerical Answer Type (NAT)** questions.
            </li>
            <li>
              **Do not refresh** the page or close the browser window during the
              test, as this may lead to unsaved answers or test termination.
            </li>
            <li>
              Ensure you have a **stable internet connection** throughout the
              duration of the test.
            </li>
          </ul>
        </div>

        <div className="instruction-section">
          <h2>Question Palette</h2>
          <p>
            The **Question Palette** on the right side of the screen shows the
            status of each question using the following symbols:
          </p>
          <ul className="instruction-list question-palette-legend">
            <li>
              <span className="q-status-box q-status-not-visited"></span> You
              have **NOT visited** the question yet.
            </li>
            <li>
              <span className="q-status-box q-status-not-answered"></span> You
              have **NOT answered** the question.
            </li>
            <li>
              <span className="q-status-box q-status-answered"></span> You have
              **answered** the question.
            </li>
            <li>
              <span className="q-status-box q-status-marked-for-review"></span>{" "}
              You have **NOT answered** the question but have marked it for
              review.
            </li>
            <li>
              <span className="q-status-box q-status-answered-and-marked-for-review"></span>{" "}
              You have **answered** the question and marked it for review. This
              answer **will be evaluated**.
            </li>
          </ul>
          <p>
            You can click on the arrow (typically an icon like `«` or `‹`)
            which appears to the left of the question palette to collapse it,
            maximizing your question window. To view the question palette again,
            click on the corresponding arrow on the right side of the question
            window.
          </p>
        </div>

        <div className="instruction-section">
          <h2>Navigating and Answering Questions</h2>
          <ul className="instruction-list">
            <li>
              Click on a **question number** in the Question Palette to go to
              that question directly. **Note:** Using this option does NOT save
              your current answer.
            </li>
            <li>
              Click on **"Save & Next"** to save your answer for the current
              question and move to the next.
            </li>
            <li>
              You can **revisit any question** at any time during the test
              duration.
            </li>
          </ul>

          <h3>Procedure for Multiple Choice Questions (MCQ):</h3>
          <ul className="instruction-list">
            <li>
              To select your answer, click on the **radio button** next to the
              desired option.
            </li>
            <li>
              To deselect your chosen answer, click on the selected option's
              radio button again or use the **"Clear Response"** button.
            </li>
            <li>
              To change your answer, simply click on the radio button of a
              different option.
            </li>
            <li>
              To save your answer, you **MUST** click the **"Save & Next"**
              button. If you navigate away without clicking "Save & Next", your
              new selection will not be saved.
            </li>
          </ul>

          <h3>Procedure for Multiple Select Questions (MSQ):</h3>
          <ul className="instruction-list">
            <li>
             To select your answer, click on the checkbox next to each desired option. You can select one or more options.
            </li>
            <li>
              To deselect a chosen answer, click on the selected option's checkbox again or use the "Clear Response" button.
            </li>
            <li>
              To change your answer, simply click on the checkbox of the options you wish to select or deselect.
            </li>
            <li>
              To save your answer, you MUST click the "Save & Next" button. If you navigate away without clicking "Save & Next", your new selection(s) will not be saved.
            </li>
          </ul>

          <h3>Procedure for Numerical Answer Type (NAT) Questions:</h3>
          <ul className="instruction-list">
            <li>
              To enter a numerical answer, use the **virtual numeric keypad**
              that appears below the question. Your physical keyboard will not
              work for input.
            </li>
            <li>
              To clear your answer, click on the **"Clear Response"** button.
            </li>
            <li>
              Your entered NAT answer will be retained when you revisit the
              question.
            </li>
          </ul>
        </div>

        <div className="instruction-section">
          <h2>Navigating Through Sections</h2>
          <ul className="instruction-list">
            <li>
              Sections in this question paper (e.g., General Aptitude, Subject
              Specific) are displayed on the **top bar of the screen**.
            </li>
            <li>
              The section you are currently viewing will be **highlighted**.
            </li>
            <li>
              You can switch between sections by clicking on their respective
              names in the top bar.
            </li>
            <li>
              After clicking **"Save & Next"** on the last question of a
              section, you will automatically be taken to the first question of
              the next section.
            </li>
          </ul>
        </div>

        <div className="instruction-section">
          <h2>Test Submission</h2>
          <ul className="instruction-list">
            <li>
              The test will automatically submit when the timer reaches zero.
            </li>
            <li>
              You can also manually submit the test at any point by clicking the
              **"Submit Test"** button (usually found near the bottom of the
              question palette).
            </li>
            <li>
              Upon clicking "Submit Test," a **confirmation prompt** will
              appear: "Are you sure you want to submit the test?".
            </li>
            <li>
              If you confirm ("Yes"), you will be redirected to the **Result
              Page** to view your score, percentage, rank, and detailed
              solutions.
            </li>
            <li>
              An email confirmation will also be sent to your registered email
              address after successful submission.
            </li>
          </ul>
        </div>

        <div className="declaration-section">
          <label className="declaration-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I have read and understood all the instructions. I agree to abide
              by the rules and regulations of this examination.
            </span>
          </label>
        </div>

        <button
          className="start-test-button"
          onClick={handleStart}
          disabled={!agreed}
          aria-disabled={!agreed} // For accessibility
        >
          Ready to Begin
        </button>
      </div>
    </div>
  );
};

export default InstructionPopup;