from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
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
    color = Column(String(7), nullable=False)

    members = relationship("Voter", back_populates="group")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)

    members = relationship("Voter", back_populates="role")


class Commission(Base):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, unique=True)

    members = relationship("Voter", back_populates="commission")


class Voter(Base):
    __tablename__ = "voters"

    id = Column(Integer, primary_key=True)
    firstname = Column(String(100), nullable=False)
    lastname = Column(String(100), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    commission_id = Column(Integer, ForeignKey("commissions.id"), nullable=True)
    circonscription = Column(String(200), nullable=True)

    group = relationship("Group", back_populates="members")
    role = relationship("Role", back_populates="members")
    commission = relationship("Commission", back_populates="members")
    answers = relationship("Answer", back_populates="voter")


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
    has_passed = Column(Boolean, nullable=False, default=False)

    categories = relationship("Category", secondary=question_category, back_populates="questions")
    answers = relationship("Answer", back_populates="question")


class Answer(Base):
    __tablename__ = "answers"

    voter_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"), primary_key=True)
    value = Column(Boolean, nullable=False)
    answered_at = Column(DateTime, default=lambda: datetime.now(UTC))

    voter = relationship("Voter", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class VoterVoterSim(Base):
    __tablename__ = "voter_voter_similarity"

    voter_a_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    voter_b_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    similarity = Column(Float, nullable=False)
    raw_similarity = Column(Float, nullable=False)
    shared_count = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    per_category = Column(JSON, nullable=True)


class VoterGroupSim(Base):
    __tablename__ = "voter_group_similarity"

    voter_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    similarity = Column(Float, nullable=False)
    shared_count = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    per_category = Column(JSON, nullable=True)


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


class VoterEmbedding(Base):
    __tablename__ = "voter_embedding"

    voter_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True, nullable=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    stress = Column(Float, nullable=False)


class GroupEmbedding(Base):
    __tablename__ = "group_embedding"

    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True, nullable=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    stress = Column(Float, nullable=False)


class CategoryDiscriminativeness(Base):
    __tablename__ = "category_discriminativeness"

    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True)
    info_gain = Column(Float, nullable=False)
    normalized_ig = Column(Float, nullable=False)
    variance_score = Column(Float, nullable=False)
    per_group_breakdown = Column(JSON, nullable=True)
