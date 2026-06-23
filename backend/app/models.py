from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


question_category = Table(
    "question_category",
    Base.metadata,
    Column("question_id", Integer, ForeignKey("questions.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, unique=True)

    members = relationship("Person", back_populates="group")


class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)

    group = relationship("Group", back_populates="members")
    answers = relationship("Answer", back_populates="person")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, unique=True)

    questions = relationship("Question", secondary=question_category, back_populates="categories")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)
    description = Column(Text, nullable=True)

    categories = relationship("Category", secondary=question_category, back_populates="questions")
    answers = relationship("Answer", back_populates="question")


class Answer(Base):
    __tablename__ = "answers"

    person_id = Column(Integer, ForeignKey("people.id"), primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"), primary_key=True)
    value = Column(Boolean, nullable=False)
    answered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    person = relationship("Person", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class PersonPersonSim(Base):
    __tablename__ = "person_person_similarity"

    person_a_id = Column(Integer, ForeignKey("people.id"), primary_key=True)
    person_b_id = Column(Integer, ForeignKey("people.id"), primary_key=True)
    similarity = Column(Float, nullable=False)
    raw_similarity = Column(Float, nullable=False)
    shared_count = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    per_category = Column(JSON, nullable=True)


class PersonGroupSim(Base):
    __tablename__ = "person_group_similarity"

    person_id = Column(Integer, ForeignKey("people.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    similarity = Column(Float, nullable=False)
    shared_count = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)


class GroupGroupSim(Base):
    __tablename__ = "group_group_similarity"

    group_a_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    group_b_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    similarity = Column(Float, nullable=False)
    per_category = Column(JSON, nullable=True)


class GroupCohesivity(Base):
    __tablename__ = "group_cohesivity"

    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    cohesivity = Column(Float, nullable=False)
    per_category = Column(JSON, nullable=True)
