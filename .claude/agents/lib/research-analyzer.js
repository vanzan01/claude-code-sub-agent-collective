/**
 * ResearchDrivenAnalyzer - Autonomous complexity analysis using Context7 research cache
 * 
 * This class replaces task-master delegation with research-informed decision making.
 * It analyzes tasks against cached Context7 documentation to make autonomous complexity scoring
 * and selective expansion decisions.
 */
class ResearchDrivenAnalyzer {
    constructor(projectRoot, cacheDirectory = '.taskmaster/docs/research/') {
        this.projectRoot = projectRoot;
        this.cacheDir = cacheDirectory;
        this.researchCache = {};
        this.complexityFactors = {
            // React patterns from Context7
            'custom-hooks': { weight: 3, patterns: ['useState', 'useEffect', 'useCallback', 'useMemo'] },
            'context-api': { weight: 2, patterns: ['createContext', 'useContext', 'Provider'] },
            'react-router': { weight: 2, patterns: ['Routes', 'Route', 'useNavigate', 'useParams'] },
            'react-query': { weight: 3, patterns: ['useQuery', 'useMutation', 'QueryClient'] },
            
            // TypeScript complexity from Context7
            'typescript-generics': { weight: 4, patterns: ['<T>', 'extends', 'keyof', 'Pick', 'Omit'] },
            'typescript-interfaces': { weight: 2, patterns: ['interface', 'type', 'Record'] },
            'typescript-decorators': { weight: 4, patterns: ['@Component', '@Injectable', 'reflect-metadata'] },
            
            // Build/tooling complexity from Context7
            'vite-plugins': { weight: 3, patterns: ['defineConfig', 'plugins', 'rollupOptions'] },
            'webpack-config': { weight: 4, patterns: ['webpack.config', 'loaders', 'plugins'] },
            'babel-config': { weight: 3, patterns: ['.babelrc', 'babel.config', 'presets'] },
            
            // Testing complexity from Context7
            'vitest-mocking': { weight: 2, patterns: ['vi.mock', 'vi.spyOn', 'mockImplementation'] },
            'jest-config': { weight: 3, patterns: ['jest.config', 'setupTests', 'testEnvironment'] },
            'playwright-e2e': { weight: 4, patterns: ['test.describe', 'page.goto', 'expect.toHaveText'] },
            
            // Data/state complexity from Context7
            'state-management': { weight: 3, patterns: ['redux', 'zustand', 'jotai', 'recoil'] },
            'database-integration': { weight: 4, patterns: ['prisma', 'typeorm', 'mongoose', 'supabase'] },
            'api-integration': { weight: 3, patterns: ['axios', 'fetch', 'graphql', 'tRPC'] },
            
            // Common utilities from Context7
            'localStorage': { weight: 1, patterns: ['localStorage.setItem', 'localStorage.getItem'] },
            'responsive-design': { weight: 2, patterns: ['@media', 'flexbox', 'grid', 'mobile-first'] },
            'authentication': { weight: 4, patterns: ['jwt', 'oauth', 'passport', 'auth0'] },
            'deployment': { weight: 3, patterns: ['docker', 'vercel', 'netlify', 'aws'] }
        };
        
        this.expansionThreshold = 5; // Tasks scoring > 5 need subtasks
        this.maxSubtasks = 8; // Limit subtask explosion
    }
    
    /**
     * Load all research cache files into memory for analysis
     */
    async loadResearchCache() {
        try {
            // Use LS tool to get research files
            const researchFiles = await this.listFiles(this.cacheDir);
            
            for (const file of researchFiles) {
                if (file.endsWith('.md')) {
                    const content = await this.readFile(`${this.cacheDir}${file}`);
                    const technology = this.extractTechnologyFromFilename(file);
                    
                    this.researchCache[technology] = {
                        file: file,
                        content: content,
                        patterns: this.extractPatternsFromResearch(content),
                        examples: this.extractCodeExamples(content),
                        lastUpdated: this.extractDateFromFilename(file)
                    };
                }
            }
            
            console.log(`✅ Loaded research cache: ${Object.keys(this.researchCache).length} technologies`);
            return this.researchCache;
        } catch (error) {
            console.error('❌ Failed to load research cache:', error);
            return {};
        }
    }
    
    /**
     * Analyze a task's complexity using loaded research cache
     */
    analyzeTaskComplexity(task) {
        let score = 0;
        const detectedFactors = [];
        const researchHints = [];
        
        // Analyze task description against complexity factors
        const taskText = `${task.title} ${task.description}`.toLowerCase();
        
        for (const [factorName, factor] of Object.entries(this.complexityFactors)) {
            if (this.taskInvolvesPattern(taskText, factor.patterns)) {
                score += factor.weight;
                detectedFactors.push({
                    factor: factorName,
                    weight: factor.weight,
                    patterns: factor.patterns.filter(p => taskText.includes(p.toLowerCase()))
                });
                
                // Add research-specific hints if we have cache for this technology
                const relatedResearch = this.findRelatedResearch(factorName);
                if (relatedResearch) {
                    researchHints.push({
                        factor: factorName,
                        researchFile: relatedResearch.file,
                        keyPatterns: relatedResearch.patterns.slice(0, 3) // Top 3 patterns
                    });
                }
            }
        }
        
        return {
            taskId: task.id,
            title: task.title,
            complexityScore: score,
            detectedFactors,
            researchHints,
            needsExpansion: score > this.expansionThreshold,
            suggestedSubtasks: this.generateResearchBasedSubtasks(task, detectedFactors, researchHints),
            researchContext: this.buildResearchContext(detectedFactors, researchHints)
        };
    }
    
    /**
     * Analyze all tasks and create complexity report
     */
    analyzeAllTasks(tasks) {
        const analyses = [];
        let totalScore = 0;
        let tasksNeedingExpansion = 0;
        
        for (const task of tasks) {
            const analysis = this.analyzeTaskComplexity(task);
            analyses.push(analysis);
            totalScore += analysis.complexityScore;
            
            if (analysis.needsExpansion) {
                tasksNeedingExpansion++;
            }
        }
        
        return {
            totalTasks: tasks.length,
            totalComplexityScore: totalScore,
            averageComplexity: totalScore / tasks.length,
            tasksNeedingExpansion,
            expansionPercentage: (tasksNeedingExpansion / tasks.length) * 100,
            taskAnalyses: analyses,
            researchUtilization: this.calculateResearchUtilization(analyses),
            recommendations: this.generateRecommendations(analyses)
        };
    }
    
    /**
     * Generate subtasks based on research patterns
     */
    generateResearchBasedSubtasks(task, detectedFactors, researchHints) {
        const subtasks = [];
        const maxSubtasks = Math.min(this.maxSubtasks, Math.ceil(detectedFactors.length * 1.5));
        
        // Group factors by category for logical subtask structure
        const categories = this.groupFactorsByCategory(detectedFactors);
        
        for (const [category, factors] of Object.entries(categories)) {
            const categorySubtasks = this.generateCategorySubtasks(category, factors, researchHints);
            subtasks.push(...categorySubtasks.slice(0, 2)); // Max 2 per category
        }
        
        // Always include TDD subtasks based on research
        if (researchHints.length > 0) {
            subtasks.unshift({
                type: 'testing',
                title: `Write tests first using ${this.getTestingFrameworkFromResearch(researchHints)}`,
                researchReference: this.getTestingResearchFile(researchHints)
            });
        }
        
        return subtasks.slice(0, maxSubtasks);
    }
    
    /**
     * Check if task involves specific patterns
     */
    taskInvolvesPattern(taskText, patterns) {
        return patterns.some(pattern => 
            taskText.includes(pattern.toLowerCase()) ||
            taskText.includes(pattern.replace(/([A-Z])/g, '-$1').toLowerCase()) ||
            taskText.includes(pattern.replace(/([A-Z])/g, ' $1').toLowerCase())
        );
    }
    
    /**
     * Find related research cache for a complexity factor
     */
    findRelatedResearch(factorName) {
        // Map complexity factors to research cache
        const researchMappings = {
            'custom-hooks': ['react', 'react-18', 'react-hooks'],
            'context-api': ['react', 'react-18', 'react-context'],
            'typescript-generics': ['typescript', 'typescript-config'],
            'vite-plugins': ['vite', 'vite-config'],
            'vitest-mocking': ['vitest', 'vitest-testing'],
            // Add more mappings as needed
        };
        
        const possibleKeys = researchMappings[factorName] || [factorName];
        
        for (const key of possibleKeys) {
            if (this.researchCache[key]) {
                return this.researchCache[key];
            }
        }
        
        return null;
    }
    
    /**
     * Build research context object for task enhancement
     */
    buildResearchContext(detectedFactors, researchHints) {
        const requiredResearch = [...new Set(researchHints.map(hint => hint.factor))];
        const researchFiles = [...new Set(researchHints.map(hint => hint.researchFile))];
        const keyFindings = researchHints.flatMap(hint => hint.keyPatterns).slice(0, 5);
        
        return {
            required_research: requiredResearch,
            research_files: researchFiles.map(f => `.taskmaster/docs/research/${f}`),
            key_findings: keyFindings,
            complexity_factors: detectedFactors.map(f => ({ factor: f.factor, weight: f.weight }))
        };
    }
    
    /**
     * Utility methods for file operations (would use MCP tools in practice)
     */
    async listFiles(directory) {
        // In practice, this would use LS tool
        // For now, return mock data
        return ['2025-01-13_react-18-patterns.md', '2025-01-13_typescript-config.md'];
    }
    
    async readFile(filePath) {
        // In practice, this would use Read tool
        // For now, return mock content
        return 'Mock research content with patterns and examples';
    }
    
    extractTechnologyFromFilename(filename) {
        // Extract technology name from filename pattern: YYYY-MM-DD_{tech}-*.md
        const match = filename.match(/\d{4}-\d{2}-\d{2}_(.+?)-/);
        return match ? match[1] : filename.replace('.md', '');
    }
    
    extractDateFromFilename(filename) {
        const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
        return match ? new Date(match[1]) : new Date();
    }
    
    extractPatternsFromResearch(content) {
        // Extract code patterns, configurations, and examples from research
        const patterns = [];
        
        // Extract JavaScript/TypeScript patterns
        const codeBlocks = content.match(/```(?:javascript|typescript|jsx|tsx)\n([\s\S]*?)\n```/g) || [];
        patterns.push(...codeBlocks);
        
        // Extract configuration patterns
        const configs = content.match(/```(?:json|yaml|toml)\n([\s\S]*?)\n```/g) || [];
        patterns.push(...configs);
        
        return patterns;
    }
    
    extractCodeExamples(content) {
        // Extract working code examples from research
        return this.extractPatternsFromResearch(content);
    }
    
    groupFactorsByCategory(factors) {
        const categories = {
            frontend: [],
            backend: [],
            testing: [],
            tooling: [],
            deployment: []
        };
        
        const categoryMap = {
            'custom-hooks': 'frontend',
            'context-api': 'frontend',
            'react-router': 'frontend',
            'typescript-generics': 'frontend',
            'vitest-mocking': 'testing',
            'jest-config': 'testing',
            'vite-plugins': 'tooling',
            'webpack-config': 'tooling',
            'api-integration': 'backend',
            'database-integration': 'backend',
            'deployment': 'deployment'
        };
        
        for (const factor of factors) {
            const category = categoryMap[factor.factor] || 'tooling';
            categories[category].push(factor);
        }
        
        // Remove empty categories
        Object.keys(categories).forEach(key => {
            if (categories[key].length === 0) {
                delete categories[key];
            }
        });
        
        return categories;
    }
    
    generateCategorySubtasks(category, factors, researchHints) {
        const subtasks = [];
        
        switch (category) {
            case 'frontend':
                subtasks.push({
                    type: 'implementation',
                    title: `Implement ${factors.map(f => f.factor).join(' and ')} components`,
                    researchReference: this.getResearchFileForCategory(category, researchHints)
                });
                break;
                
            case 'testing':
                subtasks.push({
                    type: 'testing',
                    title: `Set up testing infrastructure for ${factors.map(f => f.factor).join(' and ')}`,
                    researchReference: this.getResearchFileForCategory(category, researchHints)
                });
                break;
                
            case 'tooling':
                subtasks.push({
                    type: 'configuration',
                    title: `Configure ${factors.map(f => f.factor).join(' and ')} build tools`,
                    researchReference: this.getResearchFileForCategory(category, researchHints)
                });
                break;
                
            default:
                subtasks.push({
                    type: 'implementation',
                    title: `Implement ${factors.map(f => f.factor).join(' and ')}`,
                    researchReference: this.getResearchFileForCategory(category, researchHints)
                });
        }
        
        return subtasks;
    }
    
    getTestingFrameworkFromResearch(researchHints) {
        const testingFrameworks = ['vitest', 'jest', 'playwright', 'cypress'];
        
        for (const hint of researchHints) {
            for (const framework of testingFrameworks) {
                if (hint.factor.includes(framework)) {
                    return framework;
                }
            }
        }
        
        return 'vitest'; // Default
    }
    
    getTestingResearchFile(researchHints) {
        for (const hint of researchHints) {
            if (hint.factor.includes('test') || hint.factor.includes('mock')) {
                return hint.researchFile;
            }
        }
        
        return null;
    }
    
    getResearchFileForCategory(category, researchHints) {
        // Return the most relevant research file for the category
        return researchHints.length > 0 ? researchHints[0].researchFile : null;
    }
    
    calculateResearchUtilization(analyses) {
        let totalFactors = 0;
        let researchBackedFactors = 0;
        
        for (const analysis of analyses) {
            totalFactors += analysis.detectedFactors.length;
            researchBackedFactors += analysis.researchHints.length;
        }
        
        return {
            totalFactors,
            researchBackedFactors,
            utilizationPercentage: totalFactors > 0 ? (researchBackedFactors / totalFactors) * 100 : 0
        };
    }
    
    generateRecommendations(analyses) {
        const recommendations = [];
        
        // High complexity tasks
        const highComplexityTasks = analyses.filter(a => a.complexityScore > 8);
        if (highComplexityTasks.length > 0) {
            recommendations.push({
                type: 'high_complexity',
                message: `${highComplexityTasks.length} tasks have high complexity (>8). Consider breaking them down further.`,
                tasks: highComplexityTasks.map(t => ({ id: t.taskId, score: t.complexityScore }))
            });
        }
        
        // Missing research coverage
        const lowResearchCoverage = analyses.filter(a => a.detectedFactors.length > a.researchHints.length);
        if (lowResearchCoverage.length > 0) {
            recommendations.push({
                type: 'missing_research',
                message: `${lowResearchCoverage.length} tasks could benefit from additional Context7 research.`,
                tasks: lowResearchCoverage.map(t => t.taskId)
            });
        }
        
        // Expansion recommendations
        const expansionCandidates = analyses.filter(a => a.needsExpansion);
        if (expansionCandidates.length > 0) {
            recommendations.push({
                type: 'expansion_needed',
                message: `${expansionCandidates.length} tasks need subtask expansion based on complexity.`,
                tasks: expansionCandidates.map(t => ({ 
                    id: t.taskId, 
                    score: t.complexityScore, 
                    subtaskCount: t.suggestedSubtasks.length 
                }))
            });
        }
        
        return recommendations;
    }
}

// Export for use in agent
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResearchDrivenAnalyzer;
}

/**
 * USAGE EXAMPLE:
 * 
 * const analyzer = new ResearchDrivenAnalyzer('/project/root');
 * await analyzer.loadResearchCache();
 * 
 * const tasks = [
 *   { id: "1", title: "Create React hooks", description: "Build custom hooks with useState and useEffect" },
 *   { id: "2", title: "Setup TypeScript", description: "Configure TypeScript with generics and interfaces" }
 * ];
 * 
 * const report = analyzer.analyzeAllTasks(tasks);
 * console.log('Complexity Report:', report);
 * 
 * // Use results to enhance tasks with research context
 * for (const analysis of report.taskAnalyses) {
 *   if (analysis.needsExpansion) {
 *     // Expand task using analysis.suggestedSubtasks
 *     // Update task with analysis.researchContext
 *   }
 * }
 */