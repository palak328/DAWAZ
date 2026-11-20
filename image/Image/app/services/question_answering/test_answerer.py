
from answerer import answer_question


# Temporary reviewed medicine record for testing.
# This does not modify the actual medicine catalog.
TEST_MEDICINE = {
    "id": "test001",
    "name": "Test Medicine",
    "aliases": [],
    "strength": "100 mg, 200 mg",
    "form": "tablet",
    "ingredients": ["Test Ingredient"],
    "release_type": "immediate release",
    "general_information": "A test medicine used for testing DAWAZ question answering.",
    "source_url": "TEST SOURCE",
    "reviewed": True
}


def run_test(question, expected_status, expected_text=None):
    result = answer_question(question, catalog=[TEST_MEDICINE])

    assert result["status"] == expected_status, (
        f"FAILED: {question}\n"
        f"Expected: {expected_status}\n"
        f"Received: {result}"
    )

    if expected_text:
        assert expected_text.lower() in result["answer"].lower(), (
            f"FAILED: Expected '{expected_text}' in answer: {result['answer']}"
        )

    print(f"PASS: {question}")


def main():
    print("\nDAWAZ MEDICINE Q&A TESTS")
    print("-" * 40)

    run_test(
        "What is Test Medicine used for?",
        "ANSWERED_FROM_CATALOG",
        "test medicine"
    )

    run_test(
        "What strengths are available for Test Medicine?",
        "ANSWERED_FROM_CATALOG",
        "100 mg, 200 mg"
    )

    run_test(
        "What are the ingredients of Test Medicine?",
        "ANSWERED_FROM_CATALOG",
        "Test Ingredient"
    )

    run_test(
        "What is the form of Test Medicine?",
        "ANSWERED_FROM_CATALOG",
        "tablet"
    )

    run_test(
        "What is the release type of Test Medicine?",
        "ANSWERED_FROM_CATALOG",
        "immediate release"
    )

    run_test(
        "What dose should I take of Test Medicine?",
        "DOSE_NOT_AVAILABLE"
    )

    run_test(
    "What are the side effects of Test Medicine?",
    "PROFESSIONAL_ADVICE_REQUIRED"
)

    print("-" * 40)
    print("ALL MEDICINE Q&A TESTS PASSED!")


if __name__ == "__main__":
    main()
