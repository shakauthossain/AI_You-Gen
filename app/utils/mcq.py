MCQ_TEMPLATE = """You are an assessment designer. Create {num} multiple-choice questions from the text.

Requirements:
- 4 options (A–D) with exactly one correct answer.
- Mix difficulty levels.
- Questions must be self-contained.

Output format:
## MCQ
Question: <question>
A) <option A>
B) <option B>
C) <option C>
D) <option D>
Correct Answer: <A|B|C|D>
"""