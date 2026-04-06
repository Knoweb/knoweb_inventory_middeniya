# Fix Lombok annotation processing for all services
$services = @(
    "user-service",
    "product-service",
    "inventory-service",
    "order-service",
    "warehouse-service",
    "supplier-service",
    "notification-service",
    "catalog-service",
    "reporting-service"
)

foreach ($service in $services) {
    $pomPath = Join-Path $PSScriptRoot "$service\pom.xml"
    
    if (Test-Path $pomPath) {
        Write-Host "Processing $service..." -ForegroundColor Cyan
        
        $content = Get-Content $pomPath -Raw
        
        # Update Lombok dependency to optional
        $content = $content -replace '(<dependency>\s*<groupId>org\.projectlombok<\/groupId>\s*<artifactId>lombok<\/artifactId>)\s*(<\/dependency>)', '$1<optional>true</optional>$2'
        
        # Update spring-boot-maven-plugin configuration
        if ($content -match '<plugin>\s*<groupId>org\.springframework\.boot<\/groupId>\s*<artifactId>spring-boot-maven-plugin<\/artifactId>\s*<\/plugin>') {
            $content = $content -replace '(<plugin>\s*<groupId>org\.springframework\.boot<\/groupId>\s*<artifactId>spring-boot-maven-plugin<\/artifactId>)\s*(<\/plugin>)', 
                '$1<configuration><excludes><exclude><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId></exclude></excludes></configuration>$2'
        }
        
        # Add compiler plugin if not exists (right after <plugins> tag)
        if ($content -notmatch 'maven-compiler-plugin') {
            $compilerPlugin = '<plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><configuration><source>17</source><target>17</target><annotationProcessorPaths><path><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><version>1.18.30</version></path></annotationProcessorPaths></configuration></plugin>'
            $content = $content -replace '(<build>\s*<plugins>)', "`$1$compilerPlugin"
        }
        
        Set-Content -Path $pomPath -Value $content
        Write-Host "  Updated $service" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "All services updated!" -ForegroundColor Green
