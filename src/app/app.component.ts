import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { event as d3Event } from 'd3-selection';
import * as R from 'ramda';
import { DataService } from './services/data.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';  

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'globe-demo';

  private countryData: any;
  public countryDetails: string | undefined;

  constructor(
    private dataService: DataService
  ) {
    
  }

  ngOnInit(): void {
    this.dataService.loadData();

    let dataSub: Subscription = this.dataService.getData()
      .pipe(
        finalize(()=>{
          dataSub.unsubscribe();
          dataSub = null;
        })
      )
      .subscribe(newData => {
        this.countryData = newData;
        if(this.countryData) {
          this.loadGlobe(3);
        }
      });
  }

  private loadGlobe(solution?: 1 | 2 | 3) {
    (!solution) && (solution = 1);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const sensitivity = 75;

    const projection = d3.geoOrthographic()
      .scale(400)
      .center([0, 0])
      .rotate([0, -30])
      .translate([width / 2, height / 2]);


    const initialScale = projection.scale();
    let path = d3.geoPath().projection(projection);

    const svg = d3.select('#globe')
      .append('svg')
      .attr('width', width - 20)
      .attr('height', height - 20);

    const globe = svg.append('circle')
      .attr('fill', '#ADD8E6')
      .attr('stroke', '#000')
      .attr('stroke-width', '0.2')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', initialScale);

    svg.call(d3.drag().on('drag', () => {
      const rotate = projection.rotate();
      const k = sensitivity / projection.scale();
      projection.rotate([
        rotate[0] + d3Event.dx * k,
        rotate[1] - d3Event.dy * k
      ]);
      path = d3.geoPath().projection(projection);
      svg.selectAll('path').attr('d', path);
    }))
      .call(d3.zoom().on('zoom', () => {
        if (d3Event.transform.k > 0.3) {
          projection.scale(initialScale * d3Event.transform.k);
          path = d3.geoPath().projection(projection);
          svg.selectAll('path').attr('d', path);
          globe.attr('r', projection.scale());
        }
        else {
          d3Event.transform.k = 0.3;
        }
      }));

    const map = svg.append('g');

    /* BAD DATA (France, Norway etc) 
      *****************************************************************
      ISSUE:
        ISO_A2's for problematic conuntries are "-99" rather than country code (e.g. "FR")
        - prevents mapping to index keys of API data
        
        - 4 instances: 
            France (needed)
            Norway (needed)
            Northern Cyprus
            Somaliland

        Data comes from NaturalEarth GeoJson, went bad after v2.0.0 
        - supplied data is v4.0.0, verified against separate download 
          - (assets/ne_110m_admin_0_countries_v4.0.0.json) / (https://github.com/martynafford/natural-earth-geojson/blob/master/110m/cultural/ne_110m_admin_0_countries.json?short_path=e3d3723)
        
        - known issue: https://github.com/nvkelso/natural-earth-vector/issues/268#issuecomment-413158236
          - "fixed" in v5.1.1 - only France + Norway 
            - France and Norway have correct ISO_A2_EH values, still -99 for ISO_A2
            - Northern Cyprus and Somaliland still -99 for both
            - (assets/ne_110m_admin_0_countries_v5.1.1.json) / (https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson)
        
      *****************************************************************

      SOLUTION 1 - Programatic in-app workaround - works for France and Norway, not Northern Cyprus or Somaliland:
        Use existing data, fallback on first 2 chars of .SOV_A3 when .ISO_A2 is corrupted
        - SOV_A3.substring(0, 2) appears to match the ISO_A2 in 99% cases, so use instead where ISO_A2 is corrupted 
          - Works for the 2/4 cases that are needed (e.g. works for France and Norway, not Northern Cyprus or Somaliland )
            - Somalilands and Northern Cyprus' SOV_A3.substring(0, 2) === Somalias and Cyprus' ISO_A2 respectively, creating overlaps
              - Somaliland would hook off the API response values for Somalia 
              - Northern Cyprus would hook off the API response values for Cyprus 

              - non issue with current API data / use case, as Somalia + Cyprus are entitled: false, dataAvailale: false anyway

      
      SOLUTION 2 - Fix/Change data or upstream API change 
        Manually fix bad ISO_A2 keys for Norway and France in existing data (leaving Somalialand + Northern Cyprus unchanged as per overlap above)
          (assets/ne_110m_admin_0_countries_FIXED_ISO_A2) 
        OR
        Update API to index response against a distinctly unique key that is uncorrupted in NaturalEarth GeoJson (e.g. NAME)
        OR        
        Downgrade NaturalEarth GeoJson data pre-corruption (v2.0.0)
        - old/inaccurate data

      
      SOLUTION 3 - Use updated dataset and ISO_A2_EH for API lookup key rather than ISO_A2
        - v5.1.1 NaturalEarth GeoJson has ISO_A2_EH set correctly for France and Norway (but still not Somaliland or Nortern  Cyprus) 
          (assets/ne_110m_admin_0_countries_v5.1.1.json)
    */

    this['loadDataSolution' + 1](map, path);
  }

  private loadDataSolution1(map, path): void {
    d3.json('assets/ne_110m_admin_0_countries.json', (err, json: {[key: string]: any}) => {     
      map.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(json.features)
        .enter().append('path')
        .attr('class', (d: any) => 'country_' + chooseProp(d))
        .attr('d', path)
        .attr('fill', (d: any) => this.getScoreColour(this.getCountryScore(chooseProp(d))))
        .style('stroke', 'black')
        .style('stroke-width', 0.3)
        .on('mouseleave', (d: any) => this.clearDetails())
        .on('mouseover', (d: any) => this.showDetails(chooseProp(d), d.properties.NAME));
    });
    
    function chooseProp(f): string {
      return isNaN(f.properties.ISO_A2) 
        ? f.properties.ISO_A2 
        : f.properties.SOV_A3.substring(0, 2);
    }
  }

  private loadDataSolution2(map: any, path: string): void {
    d3.json('assets/ne_110m_admin_0_countries_FIXED_ISO_A2.json', (err, json: {[key: string]: any}) => {
      map.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(json.features)
        .enter().append('path')
        .attr('class', (d: any) => 'country_' + d.properties.ISO_A2)
        .attr('d', path)
        .attr('fill', (d: any) => this.getScoreColour(this.getCountryScore(d.properties.ISO_A2)))
        .style('stroke', 'black')
        .style('stroke-width', 0.3)
        .on('mouseleave', (d: any) => this.clearDetails())
        .on('mouseover', (d: any) => this.showDetails(d.properties.ISO_A2, d.properties.NAME));
    });
  }

  private loadDataSolution3(map: any, path: string): void {
    d3.json('assets/ne_110m_admin_0_countries_v5.1.1.json', (err, json: {[key: string]: any}) => {
      map.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(json.features)
        .enter().append('path')
        .attr('class', (d: any) => 'country_' + d.properties.ISO_A2_EH)
        .attr('d', path)
        .attr('fill', (d: any) => this.getScoreColour(this.getCountryScore(d.properties.ISO_A2_EH)))
        .style('stroke', 'black')
        .style('stroke-width', 0.3)
        .on('mouseleave', (d: any) => this.clearDetails())
        .on('mouseover', (d: any) => this.showDetails(d.properties.ISO_A2_EH, d.properties.NAME));
    });
  }

  private getScoreColour(score: number | null, defaultColor = 'LightGray'): string {
    if (R.isNil(score) || Number.isNaN(score) || score > 10) {
        return defaultColor;
    }
    if (score <= 2.5) {
        return '#ce181f';
    }
    if (score <= 5) {
        return '#f47721';
    }
    if (score <= 7.5) {
        return '#ffc709';
    }
    return '#d6e040';
  }


  private getCountryScore(countryCode: string): number | undefined {
    const country = this.countryData[countryCode];

    return country && country.entitled ? country.score : undefined;
  }

  private clearDetails() {
    this.countryDetails = undefined;
  }

  private showDetails(countryCode: string, countryName: string) {
    const country = this.countryData[countryCode];

    if (!country || !country.entitled) {
      this.countryDetails = undefined;
      return;
    }
    this.countryDetails = `${countryName}: ${country?.score?.toFixed(2)}`;
  }
}
