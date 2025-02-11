import { Router } from 'express';
import { db } from '@db';
import { seasonalScopes, ageGroupSettings } from '@db/schema';
import { and, eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    console.log('Fetching seasonal scopes...');
    const scopes = await db.query.seasonalScopes.findMany({
      with: {
        ageGroups: {
          columns: {
            id: true,
            seasonalScopeId: true,
            ageGroup: true,
            birthYear: true,
            gender: true,
            divisionCode: true,
            minBirthYear: true,
            maxBirthYear: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });
    console.log('Fetched scopes:', JSON.stringify(scopes, null, 2));
    res.json(scopes);
  } catch (error) {
    console.error('Error fetching seasonal scopes:', error);
    res.status(500).json({ message: 'Failed to fetch seasonal scopes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, startYear, endYear, ageGroups } = req.body;
    console.log('Creating seasonal scope with data:', { name, startYear, endYear, ageGroups });

    const [scope] = await db.insert(seasonalScopes).values({
      name,
      startYear,
      endYear,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    if (ageGroups && ageGroups.length > 0) {
      const ageGroupsToInsert = ageGroups.map((group) => ({
        seasonalScopeId: scope.id,
        ageGroup: group.ageGroup,
        birthYear: group.birthYear,
        minBirthYear: group.birthYear,
        maxBirthYear: group.birthYear,
        gender: group.gender,
        divisionCode: group.divisionCode,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await db.insert(ageGroupSettings).values(ageGroupsToInsert);
    }

    const createdScope = await db.query.seasonalScopes.findFirst({
      where: eq(seasonalScopes.id, scope.id),
      with: {
        ageGroups: true
      }
    });

    res.status(200).json(createdScope);
  } catch (error) {
    console.error('Error creating seasonal scope:', error);
    res.status(500).json({ message: 'Failed to create seasonal scope' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, startYear, endYear } = req.body;

    const [updatedScope] = await db.update(seasonalScopes)
      .set({
        name,
        startYear,
        endYear,
        updatedAt: new Date(),
      })
      .where(eq(seasonalScopes.id, id))
      .returning();

    if (!updatedScope) {
      return res.status(404).json({ message: 'Seasonal scope not found' });
    }

    const scope = await db.query.seasonalScopes.findFirst({
      where: eq(seasonalScopes.id, id),
      with: {
        ageGroups: true
      }
    });

    res.json(scope);
  } catch (error) {
    console.error('Error updating seasonal scope:', error);
    res.status(500).json({ message: 'Failed to update seasonal scope' });
  }
});

export default router;