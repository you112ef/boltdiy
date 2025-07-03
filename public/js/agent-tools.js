// نظام الأدوات المتقدم للوكلاء - Advanced Agent Tools System
class BaseTool {
    constructor(name, agent) {
        this.name = name;
        this.agent = agent;
        this.isInitialized = false;
    }

    async execute(context) {
        throw new Error('execute method must be implemented');
    }

    async initialize() {
        this.isInitialized = true;
    }
}

// أداة تحليل الكود
class CodeAnalysisTool extends BaseTool {
    constructor(agent) {
        super('code_analysis', agent);
        this.analysisTypes = ['complexity', 'quality', 'security', 'performance'];
    }

    async execute(context) {
        const { content, language, analysisType = 'quality' } = context;
        
        if (!content) {
            throw new Error('No code content provided for analysis');
        }

        const analysis = await this.analyzeCode(content, language, analysisType);
        return {
            type: 'code_analysis',
            analysisType,
            language,
            results: analysis,
            timestamp: Date.now()
        };
    }

    async analyzeCode(code, language, type) {
        // تحليل تعقيد الكود
        const complexity = this.calculateComplexity(code);
        const quality = this.assessQuality(code, language);
        const suggestions = this.generateSuggestions(code, language);

        return {
            complexity: complexity,
            quality: quality,
            suggestions: suggestions,
            metrics: {
                lines: code.split('\n').length,
                functions: this.countFunctions(code, language),
                classes: this.countClasses(code, language),
                imports: this.countImports(code, language)
            }
        };
    }

    calculateComplexity(code) {
        // حساب التعقيد الدوري (Cyclomatic Complexity)
        const branches = (code.match(/if\s*\(|else|while\s*\(|for\s*\(|switch\s*\(/g) || []).length;
        const complexity = branches + 1;
        
        return {
            score: complexity,
            level: complexity < 5 ? 'منخفض' : complexity < 10 ? 'متوسط' : 'عالي',
            recommendations: complexity > 10 ? ['فكر في تقسيم الدالة إلى دوال أصغر'] : []
        };
    }

    assessQuality(code, language) {
        const issues = [];
        let score = 100;

        // فحص أسماء المتغيرات
        if (code.match(/\b[a-z]{1,2}\b/g)) {
            issues.push('أسماء متغيرات قصيرة جداً');
            score -= 10;
        }

        // فحص التوثيق
        const hasComments = code.includes('//') || code.includes('/*');
        if (!hasComments && code.split('\n').length > 20) {
            issues.push('نقص في التوثيق والتعليقات');
            score -= 15;
        }

        // فحص معالجة الأخطاء
        const hasErrorHandling = code.includes('try') || code.includes('catch') || code.includes('except');
        if (!hasErrorHandling && code.includes('async')) {
            issues.push('نقص في معالجة الأخطاء');
            score -= 20;
        }

        return {
            score: Math.max(0, score),
            issues: issues,
            strengths: this.identifyStrengths(code, language)
        };
    }

    identifyStrengths(code, language) {
        const strengths = [];
        
        if (code.includes('const ') && language === 'javascript') {
            strengths.push('استخدام const للمتغيرات الثابتة');
        }
        
        if (code.includes('async') && code.includes('await')) {
            strengths.push('استخدام صحيح للبرمجة غير المتزامنة');
        }
        
        if (code.includes('interface') || code.includes(': string')) {
            strengths.push('استخدام أنواع البيانات (TypeScript)');
        }

        return strengths;
    }

    generateSuggestions(code, language) {
        const suggestions = [];
        
        // اقتراحات خاصة بكل لغة
        if (language === 'javascript' || language === 'typescript') {
            if (code.includes('var ')) {
                suggestions.push('استخدم const أو let بدلاً من var');
            }
            if (!code.includes('strict')) {
                suggestions.push('فعل الوضع الصارم (strict mode)');
            }
        }
        
        if (language === 'python') {
            if (!code.includes('def ') && code.length > 100) {
                suggestions.push('فكر في تقسيم الكود إلى دوال');
            }
        }

        return suggestions;
    }

    countFunctions(code, language) {
        const patterns = {
            javascript: /function\s+\w+|const\s+\w+\s*=\s*\(|\w+\s*=>\s*{/g,
            python: /def\s+\w+/g,
            java: /(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/g
        };
        
        const pattern = patterns[language] || patterns.javascript;
        return (code.match(pattern) || []).length;
    }

    countClasses(code, language) {
        const patterns = {
            javascript: /class\s+\w+/g,
            python: /class\s+\w+/g,
            java: /(public|private)?\s*class\s+\w+/g
        };
        
        const pattern = patterns[language] || patterns.javascript;
        return (code.match(pattern) || []).length;
    }

    countImports(code, language) {
        const patterns = {
            javascript: /import\s+.*from|const\s+.*=\s*require/g,
            python: /import\s+\w+|from\s+\w+\s+import/g,
            java: /import\s+[\w.]+/g
        };
        
        const pattern = patterns[language] || patterns.javascript;
        return (code.match(pattern) || []).length;
    }
}

// أداة إعادة هيكلة الكود
class RefactoringTool extends BaseTool {
    constructor(agent) {
        super('refactoring', agent);
        this.refactoringStrategies = ['extract_function', 'rename_variable', 'remove_duplication', 'simplify_conditionals'];
    }

    async execute(context) {
        const { content, language, strategy = 'auto' } = context;
        
        const refactoredCode = await this.refactorCode(content, language, strategy);
        return {
            type: 'refactoring',
            original: content,
            refactored: refactoredCode.code,
            changes: refactoredCode.changes,
            improvements: refactoredCode.improvements
        };
    }

    async refactorCode(code, language, strategy) {
        const changes = [];
        let refactoredCode = code;
        
        // استخراج الدوال الطويلة
        if (strategy === 'auto' || strategy === 'extract_function') {
            const extraction = this.extractLongFunctions(refactoredCode, language);
            refactoredCode = extraction.code;
            changes.push(...extraction.changes);
        }

        // إزالة التكرار
        if (strategy === 'auto' || strategy === 'remove_duplication') {
            const deduplication = this.removeDuplication(refactoredCode, language);
            refactoredCode = deduplication.code;
            changes.push(...deduplication.changes);
        }

        // تحسين الشروط
        if (strategy === 'auto' || strategy === 'simplify_conditionals') {
            const simplification = this.simplifyConditionals(refactoredCode, language);
            refactoredCode = simplification.code;
            changes.push(...simplification.changes);
        }

        return {
            code: refactoredCode,
            changes: changes,
            improvements: this.calculateImprovements(code, refactoredCode)
        };
    }

    extractLongFunctions(code, language) {
        const changes = [];
        // تحليل الدوال الطويلة واستخراجها
        // هذا مثال مبسط - في التطبيق الحقيقي ستكون العملية أكثر تعقيداً
        
        const longFunctionPattern = /function\s+\w+[^{]*{[^{}]*({[^{}]*}[^{}]*)*[^{}]{200,}}/g;
        let refactoredCode = code;
        
        const matches = code.match(longFunctionPattern);
        if (matches) {
            changes.push({
                type: 'extract_function',
                description: `تم العثور على ${matches.length} دالة طويلة يمكن تقسيمها`,
                suggestion: 'فكر في تقسيم هذه الدوال إلى دوال أصغر'
            });
        }

        return { code: refactoredCode, changes };
    }

    removeDuplication(code, language) {
        const changes = [];
        let refactoredCode = code;
        
        // البحث عن التكرار في الكود
        const lines = code.split('\n');
        const duplicates = this.findDuplicateLines(lines);
        
        if (duplicates.length > 0) {
            changes.push({
                type: 'remove_duplication',
                description: `تم العثور على ${duplicates.length} خط مكرر`,
                suggestion: 'يمكن تحسين الكود بإزالة التكرار'
            });
        }

        return { code: refactoredCode, changes };
    }

    findDuplicateLines(lines) {
        const lineCount = {};
        const duplicates = [];
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine && trimmedLine.length > 10) {
                if (lineCount[trimmedLine]) {
                    lineCount[trimmedLine].push(index);
                } else {
                    lineCount[trimmedLine] = [index];
                }
            }
        });
        
        Object.entries(lineCount).forEach(([line, indices]) => {
            if (indices.length > 1) {
                duplicates.push({ line, indices });
            }
        });
        
        return duplicates;
    }

    simplifyConditionals(code, language) {
        const changes = [];
        let refactoredCode = code;
        
        // تبسيط الشروط المعقدة
        const complexConditions = code.match(/if\s*\([^)]{50,}\)/g);
        if (complexConditions && complexConditions.length > 0) {
            changes.push({
                type: 'simplify_conditionals',
                description: `تم العثور على ${complexConditions.length} شرط معقد`,
                suggestion: 'يمكن تبسيط الشروط المعقدة'
            });
        }

        return { code: refactoredCode, changes };
    }

    calculateImprovements(originalCode, refactoredCode) {
        const originalLines = originalCode.split('\n').length;
        const refactoredLines = refactoredCode.split('\n').length;
        
        return {
            linesReduced: originalLines - refactoredLines,
            complexityReduction: '5%', // حساب تقريبي
            readabilityImprovement: 'متوسط'
        };
    }
}

// أداة إصلاح الأخطاء
class DebuggingTool extends BaseTool {
    constructor(agent) {
        super('debugging', agent);
        this.errorTypes = ['syntax', 'runtime', 'logic', 'performance'];
    }

    async execute(context) {
        const { content, language, errors = [], errorType } = context;
        
        const fixes = await this.debugCode(content, language, errors, errorType);
        return {
            type: 'debugging',
            language,
            fixes: fixes,
            timestamp: Date.now()
        };
    }

    async debugCode(code, language, errors, errorType) {
        const fixes = [];
        
        // تحليل أخطاء الصيغة
        const syntaxErrors = this.findSyntaxErrors(code, language);
        fixes.push(...syntaxErrors);
        
        // تحليل المشاكل المحتملة
        const potentialIssues = this.findPotentialIssues(code, language);
        fixes.push(...potentialIssues);
        
        // اقتراحات التحسين
        const improvements = this.suggestImprovements(code, language);
        fixes.push(...improvements);

        return fixes;
    }

    findSyntaxErrors(code, language) {
        const errors = [];
        
        // فحص الأقواس المتطابقة
        const brackets = this.checkBrackets(code);
        if (!brackets.balanced) {
            errors.push({
                type: 'syntax',
                severity: 'error',
                message: 'أقواس غير متطابقة',
                line: brackets.errorLine,
                fix: 'تأكد من إغلاق جميع الأقواس'
            });
        }

        // فحص الفواصل المنقوطة (للغات التي تتطلبها)
        if (language === 'javascript' || language === 'java') {
            const missingSemicolons = this.findMissingSemicolons(code);
            errors.push(...missingSemicolons);
        }

        return errors;
    }

    checkBrackets(code) {
        const stack = [];
        const pairs = { '(': ')', '[': ']', '{': '}' };
        const lines = code.split('\n');
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if ('([{'.includes(char)) {
                    stack.push({ char, line: lineNum + 1 });
                } else if (')]}'.includes(char)) {
                    if (stack.length === 0) {
                        return { balanced: false, errorLine: lineNum + 1 };
                    }
                    const last = stack.pop();
                    if (pairs[last.char] !== char) {
                        return { balanced: false, errorLine: lineNum + 1 };
                    }
                }
            }
        }
        
        return { 
            balanced: stack.length === 0, 
            errorLine: stack.length > 0 ? stack[0].line : null 
        };
    }

    findMissingSemicolons(code) {
        const errors = [];
        const lines = code.split('\n');
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && 
                !trimmed.endsWith(';') && 
                !trimmed.endsWith('{') && 
                !trimmed.endsWith('}') &&
                !trimmed.startsWith('//') &&
                !trimmed.startsWith('if') &&
                !trimmed.startsWith('for') &&
                !trimmed.startsWith('while')) {
                
                errors.push({
                    type: 'syntax',
                    severity: 'warning',
                    message: 'فاصلة منقوطة مفقودة',
                    line: index + 1,
                    fix: 'أضف فاصلة منقوطة في نهاية السطر'
                });
            }
        });
        
        return errors;
    }

    findPotentialIssues(code, language) {
        const issues = [];
        
        // متغيرات غير مستخدمة
        const unusedVars = this.findUnusedVariables(code, language);
        issues.push(...unusedVars);
        
        // عمليات مقارنة خطرة
        const dangerousComparisons = this.findDangerousComparisons(code);
        issues.push(...dangerousComparisons);
        
        return issues;
    }

    findUnusedVariables(code, language) {
        const issues = [];
        // تحليل مبسط للمتغيرات غير المستخدمة
        
        const varPattern = language === 'javascript' ? 
            /(?:var|let|const)\s+(\w+)/g : 
            /(\w+)\s*=/g;
        
        const declarations = [];
        let match;
        
        while ((match = varPattern.exec(code)) !== null) {
            declarations.push(match[1]);
        }
        
        declarations.forEach(varName => {
            const usages = (code.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
            if (usages === 1) { // فقط التصريح
                issues.push({
                    type: 'logic',
                    severity: 'warning',
                    message: `المتغير '${varName}' غير مستخدم`,
                    fix: 'أزل المتغير أو استخدمه في الكود'
                });
            }
        });
        
        return issues;
    }

    findDangerousComparisons(code) {
        const issues = [];
        
        // مقارنات == بدلاً من ===
        const looseComparisons = code.match(/[^=!]==[^=]/g);
        if (looseComparisons) {
            issues.push({
                type: 'logic',
                severity: 'warning',
                message: 'استخدم === بدلاً من == للمقارنة الصارمة',
                fix: 'استبدل == بـ ==='
            });
        }
        
        return issues;
    }

    suggestImprovements(code, language) {
        const suggestions = [];
        
        // اقتراحات خاصة بكل لغة
        if (language === 'javascript') {
            if (!code.includes('use strict')) {
                suggestions.push({
                    type: 'improvement',
                    severity: 'info',
                    message: 'أضف "use strict" لتفعيل الوضع الصارم',
                    fix: 'أضف "use strict"; في بداية الملف'
                });
            }
        }
        
        if (language === 'python') {
            if (!code.includes('#!/usr/bin/env python')) {
                suggestions.push({
                    type: 'improvement',
                    severity: 'info',
                    message: 'أضف shebang في بداية الملف',
                    fix: 'أضف #!/usr/bin/env python3 في السطر الأول'
                });
            }
        }
        
        return suggestions;
    }
}

// أداة إنشاء الاختبارات
class TestingTool extends BaseTool {
    constructor(agent) {
        super('testing', agent);
        this.testFrameworks = {
            javascript: ['jest', 'mocha', 'jasmine'],
            python: ['pytest', 'unittest', 'nose'],
            java: ['junit', 'testng']
        };
    }

    async execute(context) {
        const { content, language, framework, testType = 'unit' } = context;
        
        const tests = await this.generateTests(content, language, framework, testType);
        return {
            type: 'testing',
            language,
            framework: framework || this.testFrameworks[language]?.[0],
            tests: tests,
            coverage: this.estimateCoverage(content, tests)
        };
    }

    async generateTests(code, language, framework, testType) {
        const functions = this.extractFunctions(code, language);
        const tests = [];
        
        functions.forEach(func => {
            const testCases = this.generateTestCases(func, language, framework);
            tests.push(...testCases);
        });
        
        return tests;
    }

    extractFunctions(code, language) {
        const functions = [];
        const patterns = {
            javascript: /function\s+(\w+)\s*\([^)]*\)|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
            python: /def\s+(\w+)\s*\([^)]*\):/g
        };
        
        const pattern = patterns[language];
        if (!pattern) return functions;
        
        let match;
        while ((match = pattern.exec(code)) !== null) {
            const funcName = match[1] || match[2];
            functions.push({
                name: funcName,
                params: this.extractParameters(match[0]),
                body: this.extractFunctionBody(code, match.index, language)
            });
        }
        
        return functions;
    }

    extractParameters(funcDeclaration) {
        const paramMatch = funcDeclaration.match(/\(([^)]*)\)/);
        if (!paramMatch) return [];
        
        return paramMatch[1]
            .split(',')
            .map(param => param.trim())
            .filter(param => param.length > 0);
    }

    extractFunctionBody(code, startIndex, language) {
        // استخراج مبسط لجسم الدالة
        const lines = code.substring(startIndex).split('\n');
        return lines.slice(0, 10).join('\n'); // أخذ أول 10 أسطر كمثال
    }

    generateTestCases(func, language, framework) {
        const testCases = [];
        
        // إنشاء اختبارات أساسية
        testCases.push({
            name: `test_${func.name}_basic`,
            description: `اختبار أساسي للدالة ${func.name}`,
            code: this.generateBasicTest(func, language, framework)
        });
        
        // اختبارات الحالات الحدية
        if (func.params.length > 0) {
            testCases.push({
                name: `test_${func.name}_edge_cases`,
                description: `اختبار الحالات الحدية للدالة ${func.name}`,
                code: this.generateEdgeCaseTest(func, language, framework)
            });
        }
        
        // اختبارات الأخطاء
        testCases.push({
            name: `test_${func.name}_errors`,
            description: `اختبار معالجة الأخطاء للدالة ${func.name}`,
            code: this.generateErrorTest(func, language, framework)
        });
        
        return testCases;
    }

    generateBasicTest(func, language, framework) {
        if (language === 'javascript' && framework === 'jest') {
            return `describe('${func.name}', () => {
  test('should work with valid input', () => {
    const result = ${func.name}(/* معاملات صحيحة */);
    expect(result).toBeDefined();
    // أضف المزيد من التحقق حسب الحاجة
  });
});`;
        }
        
        if (language === 'python' && framework === 'pytest') {
            return `def test_${func.name}_basic():
    """اختبار أساسي للدالة ${func.name}"""
    result = ${func.name}(# معاملات صحيحة)
    assert result is not None
    # أضف المزيد من التحقق حسب الحاجة`;
        }
        
        return `// اختبار أساسي للدالة ${func.name}`;
    }

    generateEdgeCaseTest(func, language, framework) {
        if (language === 'javascript' && framework === 'jest') {
            return `test('${func.name} should handle edge cases', () => {
  // اختبار القيم الفارغة
  expect(() => ${func.name}(null)).not.toThrow();
  expect(() => ${func.name}(undefined)).not.toThrow();
  
  // اختبار القيم الحدية
  expect(() => ${func.name}(0)).not.toThrow();
  expect(() => ${func.name}('')).not.toThrow();
});`;
        }
        
        return `// اختبار الحالات الحدية للدالة ${func.name}`;
    }

    generateErrorTest(func, language, framework) {
        if (language === 'javascript' && framework === 'jest') {
            return `test('${func.name} should handle errors properly', () => {
  // اختبار المعاملات غير الصحيحة
  expect(() => ${func.name}(/* معاملات خاطئة */)).toThrow();
});`;
        }
        
        return `// اختبار معالجة الأخطاء للدالة ${func.name}`;
    }

    estimateCoverage(code, tests) {
        const totalFunctions = (code.match(/function|def/g) || []).length;
        const testedFunctions = tests.length / 3; // تقدير: 3 اختبارات لكل دالة
        
        return {
            functions: Math.min(100, (testedFunctions / totalFunctions) * 100),
            lines: 75, // تقدير
            branches: 60 // تقدير
        };
    }
}

// أداة عامة للأدوات غير المتخصصة
class GenericTool extends BaseTool {
    constructor(name, agent) {
        super(name, agent);
    }

    async execute(context) {
        return {
            type: 'generic',
            tool: this.name,
            message: `تم تنفيذ الأداة ${this.name}`,
            context: context,
            timestamp: Date.now()
        };
    }
}

// تصدير الأدوات
window.AgentTools = {
    BaseTool,
    CodeAnalysisTool,
    RefactoringTool,
    DebuggingTool,
    TestingTool,
    GenericTool
};