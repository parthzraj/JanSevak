from pydantic import BaseModel, Field


class QuizSummary(BaseModel):
    id: str
    title: str
    category: str
    description: str
    points_reward: int
    questions_count: int
    estimated_minutes: int
    pass_mark: int
    attempts: int = 0
    best_score: int | None = None
    passed: bool = False
    points_awarded: int = 0


class QuizQuestionPublic(BaseModel):
    id: int
    question: str
    options: list[str]


class QuizDetail(BaseModel):
    id: str
    title: str
    category: str
    points_reward: int
    pass_mark: int
    questions: list[QuizQuestionPublic]


class QuizSubmit(BaseModel):
    answers: list[int] = Field(description="Chosen option index for each question, in order")


class QuestionReview(BaseModel):
    question: str
    options: list[str]
    your_answer: int
    correct_index: int
    correct: bool
    explanation: str


class QuizResult(BaseModel):
    quiz_id: str
    score: int
    total: int
    passed: bool
    pass_mark: int
    points_awarded: int
    already_rewarded: bool
    capped: bool
    note: str
    review: list[QuestionReview]
    user_points: int
    user_tier: str
