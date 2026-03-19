const Issue = require('../models/Issue');
const { getAuth } = require('@clerk/express')

// @desc    Get all issues
// @route   GET /api/issues
// @access  Public
const getIssues = async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Public
const getIssueById = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (issue) {
            res.status(200).json(issue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
    const { userId } = getAuth(req)
    // console.log("userId", userId);
    try {
        const { title, description, category, subCategory, location, imageUrl, lat, lng, authorName } = req.body;

        const issue = await Issue.create({
            title,
            description,
            category,
            subCategory,
            location: location || 'Location Not Specified',
            lat,
            lng,
            imageUrl,
            authorId: userId, // need to write logic for this
            authorName: authorName || 'Anonymous Citizen'
        });

        res.status(201).json(issue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update issue status
// @route   PUT /api/issues/:id/status
// @access  Private/Admin
const updateIssueStatus = async (req, res) => {
    try {
        const { status, assignedToId, assignedToName } = req.body;
        const issue = await Issue.findById(req.params.id);

        if (issue) {
            if (status) issue.status = status;

            if (assignedToId) {
                issue.assignedToId = assignedToId;
                issue.assignedToName = assignedToName;
            }

            const updatedIssue = await issue.save();
            res.status(200).json(updatedIssue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upvote an issue
// @route   PUT /api/issues/:id/upvote
// @access  Private
const upvoteIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (issue) {
            const userId = req.auth.userId;
            const alreadyUpvoted = issue.upvotes.includes(userId);
            if (alreadyUpvoted) {
                issue.upvotes = issue.upvotes.filter(id => id !== userId);
            } else {
                issue.upvotes.push(userId);
            }
            await issue.save();
            res.status(200).json(issue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add comment to issue
// @route   POST /api/issues/:id/comments
// @access  Private
const addComment = async (req, res) => {
    try {
        const { text, userName } = req.body;
        const issue = await Issue.findById(req.params.id);

        if (issue) {
            const comment = {
                userId: req.auth.userId,
                userName: userName || 'User',
                text
            };
            issue.comments.push(comment);
            await issue.save();
            res.status(201).json(issue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user issues
// @route   GET /api/issues/my
// @access  Private
const getUserIssues = async (req, res) => {
    try {
        const issues = await Issue.find({ authorId: req.auth.userId }).sort({ createdAt: -1 });
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Review a resolved issue
// @route   POST /api/issues/:id/review
// @access  Private
const reviewIssue = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const issue = await Issue.findById(req.params.id);

        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        if (issue.authorId !== req.auth.userId) {
            return res.status(401).json({ message: 'User not authorized to review this issue' });
        }

        if (issue.status !== 'Resolved') {
            return res.status(400).json({ message: 'Issue must be resolved before reviewing' });
        }

        if (issue.resolutionReview && issue.resolutionReview.rating) {
            return res.status(400).json({ message: 'Issue already reviewed' });
        }

        issue.resolutionReview = {
            rating: Number(rating),
            comment,
            createdAt: Date.now()
        };

        const updatedIssue = await issue.save();
        res.status(201).json(updatedIssue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getIssues,
    getIssueById,
    createIssue,
    updateIssueStatus,
    upvoteIssue,
    addComment,
    getUserIssues,
    reviewIssue
};
